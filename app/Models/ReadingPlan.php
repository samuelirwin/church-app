<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ReadingPlan extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\ReadingPlanFactory> */
    use HasFactory, InteractsWithMedia;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'slug',
        'description',
        'duration_days',
        'is_published',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'duration_days' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (ReadingPlan $plan): void {
            if (empty($plan->slug)) {
                $plan->slug = Str::slug($plan->title);
            }
        });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('cover')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    }

    /**
     * Get the plan's creator.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the daily readings for this plan.
     */
    public function days(): HasMany
    {
        return $this->hasMany(ReadingPlanDay::class)->orderBy('day_number');
    }

    /**
     * Get all enrollments for this plan.
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(ReadingPlanEnrollment::class);
    }

    /**
     * Scope to only published plans.
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }
}
