<?php

namespace App\Models;

use App\Enums\AttendanceSource;
use App\Enums\AttendanceStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Str;

/**
 * One occurrence of something people attend: a service on a given date,
 * an event, or a group meeting.
 */
class AttendanceSession extends Model
{
    /** @use HasFactory<\Database\Factories\AttendanceSessionFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'attendable_type',
        'attendable_id',
        'occurred_on',
        'guest_count',
        'notes',
        'check_in_token',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'occurred_on' => 'date',
            'guest_count' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (AttendanceSession $session): void {
            if (empty($session->check_in_token)) {
                $session->check_in_token = Str::random(40);
            }
        });
    }

    public function attendable(): MorphTo
    {
        return $this->morphTo();
    }

    public function records(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function presentRecords(): HasMany
    {
        return $this->records()->where('status', AttendanceStatus::Present);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    protected function source(): Attribute
    {
        return Attribute::get(fn (): AttendanceSource => AttendanceSource::fromModelClass($this->attendable_type));
    }

    /**
     * Human readable name, e.g. "Sunday 9am Service".
     */
    protected function title(): Attribute
    {
        return Attribute::get(fn (): string => $this->attendable?->name ?? $this->attendable?->title ?? 'Deleted '.$this->source->label());
    }

    public function scopeForSource(Builder $query, AttendanceSource $source): Builder
    {
        return $query->where('attendable_type', $source->modelClass());
    }

    /**
     * Staff see all sessions. Leaders only see sessions for groups they lead.
     */
    public function scopeManageableBy(Builder $query, User $user): Builder
    {
        if ($user->isStaffOrAbove()) {
            return $query;
        }

        return $query->forSource(AttendanceSource::Group)
            ->whereIn('attendable_id', MinistryGroup::query()->select('id')->where('leader_id', $user->id));
    }

    public function canBeManagedBy(User $user): bool
    {
        if ($user->isStaffOrAbove()) {
            return true;
        }

        return $this->source === AttendanceSource::Group
            && $this->attendable?->leader_id === $user->id;
    }

    /**
     * Self check-in via QR code only works on the day of the session.
     */
    public function isOpenForSelfCheckIn(): bool
    {
        return $this->occurred_on->isToday();
    }
}
