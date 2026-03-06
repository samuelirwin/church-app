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

class Sermon extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\SermonFactory> */
    use HasFactory, InteractsWithMedia, \Spatie\Tags\HasTags;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'slug',
        'description',
        'notes',
        'scripture_references',
        'sermon_date',
        'is_current_week',
        'video_url',
        'speaker_id',
        'series_id',
        'published_at',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scripture_references' => 'array',
            'sermon_date' => 'date',
            'is_current_week' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Sermon $sermon): void {
            if (empty($sermon->slug)) {
                $sermon->slug = Str::slug($sermon->title);
            }
        });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('cover')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

        $this->addMediaCollection('audio')
            ->singleFile()
            ->acceptsMimeTypes(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']);
    }

    /**
     * Get the sermon's speaker.
     */
    public function speaker(): BelongsTo
    {
        return $this->belongsTo(Speaker::class);
    }

    /**
     * Get the sermon's series.
     */
    public function series(): BelongsTo
    {
        return $this->belongsTo(SermonSeries::class, 'series_id');
    }

    /**
     * Get the user who created this sermon.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the downloadable resources for this sermon.
     */
    public function resources(): HasMany
    {
        return $this->hasMany(SermonResource::class)->orderBy('sort_order');
    }

    /**
     * Scope to only published sermons.
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /**
     * Scope to get the current week's sermon.
     */
    public function scopeCurrentWeek(Builder $query): Builder
    {
        return $query->where('is_current_week', true);
    }

    /**
     * Check if this sermon is published.
     */
    public function isPublished(): bool
    {
        return $this->published_at !== null && $this->published_at->isPast();
    }
}
