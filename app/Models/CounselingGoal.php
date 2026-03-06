<?php

namespace App\Models;

use App\Enums\GoalStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CounselingGoal extends Model
{
    /** @use HasFactory<\Database\Factories\CounselingGoalFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'counseling_case_id',
        'title',
        'description',
        'target_date',
        'status',
        'priority',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => GoalStatus::class,
            'target_date' => 'date',
            'priority' => 'integer',
        ];
    }

    public function counselingCase(): BelongsTo
    {
        return $this->belongsTo(CounselingCase::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isAchieved(): bool
    {
        return $this->status === GoalStatus::Achieved;
    }
}
