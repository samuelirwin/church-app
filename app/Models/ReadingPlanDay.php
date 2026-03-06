<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReadingPlanDay extends Model
{
    /** @use HasFactory<\Database\Factories\ReadingPlanDayFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'reading_plan_id',
        'day_number',
        'title',
        'scripture_reference',
        'reflection',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'day_number' => 'integer',
        ];
    }

    /**
     * Get the reading plan this day belongs to.
     */
    public function readingPlan(): BelongsTo
    {
        return $this->belongsTo(ReadingPlan::class);
    }

    /**
     * Get progress records for this day.
     */
    public function progress(): HasMany
    {
        return $this->hasMany(ReadingPlanProgress::class, 'day_id');
    }
}
