<?php

namespace App\Models;

use App\Enums\CareNeedPriority;
use App\Enums\CareNeedSource;
use App\Enums\CareNeedStatus;
use App\Enums\CareNeedType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A pastoral care need: a hospital visit, meals after a birth, a prayer
 * request, an absence follow-up, and so on. Financial help and counseling
 * have their own modules, and a need can be escalated into either.
 */
class CareNeed extends Model
{
    /** @use HasFactory<\Database\Factories\CareNeedFactory> */
    use HasFactory;

    /**
     * Prayer wall requests drop off after this many days.
     */
    public const PRAYER_WALL_DAYS = 60;

    /**
     * Mirror the column defaults so a freshly created model has them without a refresh.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'priority' => 'normal',
        'status' => 'open',
        'source' => 'manual',
        'is_confidential' => false,
        'share_on_prayer_wall' => false,
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'member_id',
        'requester_name',
        'title',
        'description',
        'type',
        'priority',
        'status',
        'source',
        'is_confidential',
        'share_on_prayer_wall',
        'assigned_to',
        'due_on',
        'resolved_at',
        'benevolent_request_id',
        'counseling_case_id',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => CareNeedType::class,
            'priority' => CareNeedPriority::class,
            'status' => CareNeedStatus::class,
            'source' => CareNeedSource::class,
            'is_confidential' => 'boolean',
            'share_on_prayer_wall' => 'boolean',
            'due_on' => 'date',
            'resolved_at' => 'datetime',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class)->withTrashed();
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function benevolentRequest(): BelongsTo
    {
        return $this->belongsTo(BenevolentRequest::class);
    }

    public function counselingCase(): BelongsTo
    {
        return $this->belongsTo(CounselingCase::class);
    }

    public function updates(): HasMany
    {
        return $this->hasMany(CareNeedUpdate::class)->latest()->orderByDesc('id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(CareNeedTask::class)->orderByRaw('completed_at is not null')->orderBy('due_on');
    }

    public function prayers(): HasMany
    {
        return $this->hasMany(CareNeedPrayer::class);
    }

    /**
     * Who the need is for: the linked member, or the name typed in by staff.
     */
    protected function personName(): Attribute
    {
        return Attribute::get(fn (): string => $this->member?->full_name ?? $this->requester_name ?? 'Unknown');
    }

    /**
     * First name only, used on the prayer wall so requests stay personal but discreet.
     */
    protected function prayerWallName(): Attribute
    {
        return Attribute::get(fn (): string => $this->member
            ? ($this->member->preferred_name ?: $this->member->first_name)
            : str($this->requester_name ?? 'Someone')->before(' ')->toString());
    }

    public function isOverdue(): bool
    {
        return $this->due_on !== null
            && $this->status->isActive()
            && $this->due_on->lt(today());
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', CareNeedStatus::activeStatuses());
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->active()->whereNotNull('due_on')->whereDate('due_on', '<', today());
    }

    /**
     * Who can see which needs:
     * - Admins see everything.
     * - Staff see everything except confidential needs they aren't assigned to or didn't create.
     * - Leaders see needs assigned to them, plus non-confidential needs for people
     *   in the ministries and groups they lead.
     * - Members see nothing here; they use their own "My Care Needs" page.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isAdmin()) {
            return $query;
        }

        if ($user->isStaffOrAbove()) {
            return $query->where(fn (Builder $q) => $q
                ->where('is_confidential', false)
                ->orWhere('assigned_to', $user->id)
                ->orWhere('created_by', $user->id));
        }

        if ($user->isLeaderOrAbove()) {
            return $query->where(fn (Builder $q) => $q
                ->where('assigned_to', $user->id)
                ->orWhere(fn (Builder $inner) => $inner
                    ->where('is_confidential', false)
                    ->whereIn('member_id', Member::query()->visibleTo($user)->select('id'))));
        }

        return $query->whereRaw('1 = 0');
    }

    public function isVisibleTo(User $user): bool
    {
        return static::query()->visibleTo($user)->whereKey($this->id)->exists();
    }

    /**
     * Needs the user raised for themselves or their household.
     */
    public function scopeRequestedBy(Builder $query, User $user): Builder
    {
        $memberIds = $user->member?->household_id
            ? Member::query()->where('household_id', $user->member->household_id)->pluck('id')
            : collect([$user->member?->id])->filter();

        return $query->where(fn (Builder $q) => $q
            ->whereIn('member_id', $memberIds)
            ->orWhere('created_by', $user->id))
            ->where('source', CareNeedSource::MemberRequest);
    }

    /**
     * Requests members chose to share, that are still open and recent.
     */
    public function scopeOnPrayerWall(Builder $query): Builder
    {
        return $query->active()
            ->where('share_on_prayer_wall', true)
            ->where('is_confidential', false)
            ->where('created_at', '>=', now()->subDays(self::PRAYER_WALL_DAYS));
    }
}
