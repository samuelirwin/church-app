<?php

namespace App\Models;

use App\Enums\EventRecurrence;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Event extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\EventFactory> */
    use HasFactory, InteractsWithMedia, \Spatie\Tags\HasTags;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'slug',
        'description',
        'body',
        'location',
        'starts_at',
        'ends_at',
        'is_all_day',
        'recurrence',
        'max_attendees',
        'is_published',
        'category_id',
        'form_id',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_all_day' => 'boolean',
            'is_published' => 'boolean',
            'recurrence' => EventRecurrence::class,
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Event $event): void {
            if (empty($event->slug)) {
                $event->slug = Str::slug($event->title);
            }
        });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('cover')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function registrationForm(): BelongsTo
    {
        return $this->belongsTo(Form::class, 'form_id');
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(EventRegistration::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('starts_at', '>=', now());
    }

    public function scopePast(Builder $query): Builder
    {
        return $query->where('starts_at', '<', now());
    }

    public function isPublished(): bool
    {
        return $this->is_published;
    }

    public function isFull(): bool
    {
        if ($this->max_attendees === null) {
            return false;
        }

        return $this->registrations()
            ->where('status', '!=', 'cancelled')
            ->count() >= $this->max_attendees;
    }

    public function availableSpots(): ?int
    {
        if ($this->max_attendees === null) {
            return null;
        }

        $registered = $this->registrations()
            ->where('status', '!=', 'cancelled')
            ->count();

        return max(0, $this->max_attendees - $registered);
    }
}
