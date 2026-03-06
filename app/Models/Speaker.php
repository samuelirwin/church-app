<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Speaker extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\SpeakerFactory> */
    use HasFactory, InteractsWithMedia;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'title',
        'bio',
    ];

    protected static function booted(): void
    {
        static::creating(function (Speaker $speaker): void {
            if (empty($speaker->slug)) {
                $speaker->slug = Str::slug($speaker->name);
            }
        });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('photo')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    }

    /**
     * Get the speaker's sermons.
     */
    public function sermons(): HasMany
    {
        return $this->hasMany(Sermon::class);
    }
}
