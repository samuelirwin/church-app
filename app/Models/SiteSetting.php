<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    /** @use HasFactory<\Database\Factories\SiteSettingFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'group',
        'key',
        'value',
    ];

    /**
     * Retrieve a single setting value by group and key.
     */
    public static function getValue(string $group, string $key, ?string $default = null): ?string
    {
        return static::query()
            ->where('group', $group)
            ->where('key', $key)
            ->value('value') ?? $default;
    }

    /**
     * Create or update a single setting value.
     */
    public static function setValue(string $group, string $key, ?string $value): void
    {
        static::query()->updateOrCreate(
            ['group' => $group, 'key' => $key],
            ['value' => $value],
        );
    }

    /**
     * Get all settings for a given group as an associative array.
     *
     * @return array<string, string|null>
     */
    public static function getByGroup(string $group): array
    {
        return static::query()
            ->where('group', $group)
            ->pluck('value', 'key')
            ->all();
    }

    public function scopeForGroup(Builder $query, string $group): Builder
    {
        return $query->where('group', $group);
    }
}
