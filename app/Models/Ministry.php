<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Ministry extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\MinistryFactory> */
    use HasFactory, InteractsWithMedia;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'body',
        'leader_id',
        'is_active',
        'sort_order',
        'meeting_schedule',
        'meeting_location',
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
        static::creating(function (Ministry $ministry): void {
            if (empty($ministry->slug)) {
                $ministry->slug = Str::slug($ministry->name);
            }
        });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('cover')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    public function groups(): HasMany
    {
        return $this->hasMany(MinistryGroup::class);
    }

    public function ministryMembers(): HasMany
    {
        return $this->hasMany(MinistryMember::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'ministry_members')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
