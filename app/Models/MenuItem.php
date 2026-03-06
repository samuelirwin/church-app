<?php

namespace App\Models;

use App\Enums\MenuItemTarget;
use App\Enums\MenuItemType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class MenuItem extends Model
{
    /** @use HasFactory<\Database\Factories\MenuItemFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'parent_id',
        'label',
        'type',
        'url',
        'route',
        'target',
        'sort_order',
        'is_active',
        'page_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => MenuItemType::class,
            'target' => MenuItemTarget::class,
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saved(function (): void {
            Cache::forget('public_navigation');
        });

        static::deleted(function (): void {
            Cache::forget('public_navigation');
        });
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }

    /**
     * Get the linked page (when type is Page).
     */
    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    /**
     * Resolve the display URL based on item type.
     */
    public function resolvedUrl(): string
    {
        return match ($this->type) {
            MenuItemType::InternalPage => $this->route ?? '/',
            MenuItemType::CustomUrl => $this->url ?? '#',
            MenuItemType::Page => $this->page ? '/pages/'.$this->page->slug : '#',
        };
    }

    /**
     * Get the nesting depth of this item (0 = top-level, 1 = child, 2 = grandchild).
     */
    public function depth(): int
    {
        if (! $this->parent_id) {
            return 0;
        }

        $parent = $this->parent;
        if ($parent && $parent->parent_id) {
            return 2;
        }

        return 1;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeTopLevel(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }
}
