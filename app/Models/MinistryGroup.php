<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class MinistryGroup extends Model
{
    /** @use HasFactory<\Database\Factories\MinistryGroupFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'ministry_id',
        'leader_id',
        'max_members',
        'meeting_day',
        'meeting_time',
        'meeting_location',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (MinistryGroup $group): void {
            if (empty($group->slug)) {
                $group->slug = Str::slug($group->name);
            }
        });
    }

    public function ministry(): BelongsTo
    {
        return $this->belongsTo(Ministry::class);
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    public function groupMembers(): HasMany
    {
        return $this->hasMany(GroupMember::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->active()->where(function ($q) {
            $q->whereNull('max_members')
                ->orWhereColumn(
                    'max_members',
                    '>',
                    \DB::raw('(SELECT COUNT(*) FROM group_members WHERE group_members.ministry_group_id = ministry_groups.id)')
                );
        });
    }

    public function isFull(): bool
    {
        if ($this->max_members === null) {
            return false;
        }

        return $this->groupMembers()->count() >= $this->max_members;
    }

    public function availableSpots(): ?int
    {
        if ($this->max_members === null) {
            return null;
        }

        return max(0, $this->max_members - $this->groupMembers()->count());
    }
}
