<?php

namespace App\Models;

use App\Enums\FollowUpStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Visitor extends Model
{
    /** @use HasFactory<\Database\Factories\VisitorFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'first_visit_date',
        'how_heard',
        'prayer_requests',
        'notes',
        'follow_up_status',
        'assigned_to',
        'converted_to_user_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'first_visit_date' => 'date',
            'follow_up_status' => FollowUpStatus::class,
        ];
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function convertedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'converted_to_user_id');
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(VisitorFollowUp::class);
    }

    public function scopeNeedingFollowUp(Builder $query): Builder
    {
        return $query->whereIn('follow_up_status', [
            FollowUpStatus::New,
            FollowUpStatus::Contacted,
            FollowUpStatus::FollowUp,
        ]);
    }

    public function scopeByStatus(Builder $query, FollowUpStatus $status): Builder
    {
        return $query->where('follow_up_status', $status);
    }

    public function scopeRecent(Builder $query): Builder
    {
        return $query->where('first_visit_date', '>=', now()->subDays(30));
    }

    public function isConverted(): bool
    {
        return $this->converted_to_user_id !== null;
    }

    public function needsFollowUp(): bool
    {
        return in_array($this->follow_up_status, [
            FollowUpStatus::New,
            FollowUpStatus::Contacted,
            FollowUpStatus::FollowUp,
        ]);
    }
}
