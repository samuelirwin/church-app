<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingPlanProgress extends Model
{
    /** @use HasFactory<\Database\Factories\ReadingPlanProgressFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'enrollment_id',
        'day_id',
        'completed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Get the enrollment this progress belongs to.
     */
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(ReadingPlanEnrollment::class, 'enrollment_id');
    }

    /**
     * Get the day this progress is for.
     */
    public function day(): BelongsTo
    {
        return $this->belongsTo(ReadingPlanDay::class, 'day_id');
    }
}
