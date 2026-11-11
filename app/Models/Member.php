<?php

namespace App\Models;

use App\Enums\Gender;
use App\Enums\HouseholdRole;
use App\Enums\MaritalStatus;
use App\Enums\MembershipStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

/**
 * A person in the church directory. Unlike a User, a member does not need
 * a login, so children and members without accounts can still be tracked.
 */
class Member extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\MemberFactory> */
    use HasFactory, InteractsWithMedia, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'household_id',
        'household_role',
        'first_name',
        'last_name',
        'preferred_name',
        'email',
        'phone',
        'date_of_birth',
        'gender',
        'marital_status',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'postal_code',
        'membership_status',
        'joined_at',
        'baptized_at',
        'emergency_contact_name',
        'emergency_contact_phone',
        'notes',
        'absence_alerted_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'joined_at' => 'date',
            'baptized_at' => 'date',
            'absence_alerted_at' => 'datetime',
            'gender' => Gender::class,
            'marital_status' => MaritalStatus::class,
            'household_role' => HouseholdRole::class,
            'membership_status' => MembershipStatus::class,
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('photo')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    public function careNeeds(): HasMany
    {
        return $this->hasMany(CareNeed::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function statusChanges(): HasMany
    {
        return $this->hasMany(MemberStatusChange::class)->latest();
    }

    /**
     * Full name built from first and last name.
     */
    protected function fullName(): Attribute
    {
        return Attribute::get(fn (): string => trim("{$this->first_name} {$this->last_name}"));
    }

    /**
     * Age in whole years, or null when no date of birth is recorded.
     */
    protected function age(): Attribute
    {
        return Attribute::get(fn (): ?int => $this->date_of_birth?->age);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('membership_status', MembershipStatus::activeStatuses());
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function (Builder $q) use ($term) {
            $q->where('first_name', 'like', "%{$term}%")
                ->orWhere('last_name', 'like', "%{$term}%")
                ->orWhere('preferred_name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%");
        });
    }

    /**
     * Limit members to those the given user is allowed to see.
     * Staff and above see everyone. Leaders only see people who belong to a
     * ministry or group they lead. Everyone else sees nothing.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isStaffOrAbove()) {
            return $query;
        }

        if (! $user->isLeaderOrAbove()) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function (Builder $q) use ($user) {
            $q->whereIn('user_id', MinistryMember::query()
                ->select('user_id')
                ->whereHas('ministry', fn (Builder $m) => $m->where('leader_id', $user->id)))
                ->orWhereIn('user_id', GroupMember::query()
                    ->select('user_id')
                    ->whereHas('group', fn (Builder $g) => $g->where('leader_id', $user->id)));
        });
    }

    public function isVisibleTo(User $user): bool
    {
        return static::query()->visibleTo($user)->whereKey($this->id)->exists();
    }

    public function hasAccount(): bool
    {
        return $this->user_id !== null;
    }
}
