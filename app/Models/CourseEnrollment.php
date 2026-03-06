<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseEnrollment extends Model
{
    /** @use HasFactory<\Database\Factories\CourseEnrollmentFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'course_id',
        'enrolled_at',
        'completed_at',
        'progress_percentage',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'enrolled_at' => 'datetime',
            'completed_at' => 'datetime',
            'progress_percentage' => 'integer',
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
     * Get the course.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Check if this enrollment is completed.
     */
    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }

    /**
     * Recalculate progress based on completed lessons.
     */
    public function recalculateProgress(): void
    {
        $totalLessons = $this->course->totalLessons();

        if ($totalLessons === 0) {
            $this->update(['progress_percentage' => 0]);

            return;
        }

        $completedLessons = LessonCompletion::where('user_id', $this->user_id)
            ->whereIn('lesson_id', $this->course->lessons()->pluck('lessons.id'))
            ->count();

        $percentage = (int) round(($completedLessons / $totalLessons) * 100);

        $this->update([
            'progress_percentage' => $percentage,
            'completed_at' => $percentage >= 100 ? now() : null,
        ]);
    }
}
