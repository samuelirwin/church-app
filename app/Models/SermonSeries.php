<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class SermonSeries extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\SermonSeriesFactory> */
    use HasFactory, InteractsWithMedia;

    /**
     * @var string
     */
    protected $table = 'sermon_series';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'slug',
        'description',
        'start_date',
        'end_date',
        'is_active',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (SermonSeries $series): void {
            if (empty($series->slug)) {
                $series->slug = Str::slug($series->title);
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
     * Get the sermons in this series.
     */
    public function sermons(): HasMany
    {
        return $this->hasMany(Sermon::class, 'series_id')->orderBy('sermon_date');
    }

    /**
     * Scope to only active series.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
