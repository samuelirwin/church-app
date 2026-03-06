<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReadingPlanEnrollment extends Model
{
    /** @use HasFactory<\Database\Factories\ReadingPlanEnrollmentFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'reading_plan_id',
        'started_at',
        'completed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Get the enrolled user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the reading plan.
     */
    public function readingPlan(): BelongsTo
    {
        return $this->belongsTo(ReadingPlan::class);
    }

    /**
     * Get the progress records for this enrollment.
     */
    public function progress(): HasMany
    {
        return $this->hasMany(ReadingPlanProgress::class, 'enrollment_id');
    }

    /**
     * Check if this enrollment is completed.
     */
    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }

    /**
     * Get the completion percentage.
     */
    public function completionPercentage(): int
    {
        $totalDays = $this->readingPlan->duration_days;

        if ($totalDays === 0) {
            return 0;
        }

        $completedDays = $this->progress()->count();

        return (int) round(($completedDays / $totalDays) * 100);
    }
}
