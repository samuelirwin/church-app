<?php

namespace App\Models;

use App\Enums\DocumentVisibility;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\Tags\HasTags;

class Document extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\DocumentFactory> */
    use HasFactory, HasTags, InteractsWithMedia;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'slug',
        'description',
        'visibility',
        'category_id',
        'uploaded_by',
        'is_published',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'visibility' => DocumentVisibility::class,
            'is_published' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Document $document): void {
            if (empty($document->slug)) {
                $document->slug = Str::slug($document->title);
            }
        });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('file')
            ->singleFile();

        $this->addMediaCollection('thumbnail')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    }

    /**
     * Get the document's category.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the user who uploaded this document.
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Scope to only published documents.
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    /**
     * Scope to documents visible to the given user.
     * Guests see only Public, members see Public + Members, staff/admin see all.
     */
    public function scopeVisibleTo(Builder $query, ?User $user): Builder
    {
        if ($user && $user->isStaffOrAbove()) {
            return $query;
        }

        if ($user) {
            return $query->whereIn('visibility', [
                DocumentVisibility::Public->value,
                DocumentVisibility::Members->value,
            ]);
        }

        return $query->where('visibility', DocumentVisibility::Public->value);
    }

    /**
     * Check if the document file is a PDF.
     */
    public function isPdf(): bool
    {
        $media = $this->getFirstMedia('file');

        return $media && $media->mime_type === 'application/pdf';
    }

    /**
     * Check if the document file is an image.
     */
    public function isImage(): bool
    {
        $media = $this->getFirstMedia('file');

        return $media && str_starts_with($media->mime_type, 'image/');
    }

    /**
     * Check if this document is published.
     */
    public function isPublished(): bool
    {
        return $this->is_published;
    }

    /**
     * Check if the given user can view this document based on visibility.
     */
    public function isVisibleTo(?User $user): bool
    {
        if ($user && $user->isStaffOrAbove()) {
            return true;
        }

        if ($user && $this->visibility === DocumentVisibility::Members) {
            return true;
        }

        return $this->visibility === DocumentVisibility::Public;
    }
}
