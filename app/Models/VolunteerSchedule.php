<?php

namespace App\Models;

use App\Enums\ScheduleStatus;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VolunteerSchedule extends Model
{
    /** @use HasFactory<\Database\Factories\VolunteerScheduleFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'volunteer_role_id',
        'user_id',
        'scheduled_date',
        'service_time_id',
        'status',
        'notes',
        'scheduled_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date',
            'status' => ScheduleStatus::class,
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(VolunteerRole::class, 'volunteer_role_id');
    }

    public function serviceTime(): BelongsTo
    {
        return $this->belongsTo(ServiceTime::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scheduler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scheduled_by');
    }

    public function scopeForNextSunday(Builder $query): Builder
    {
        $nextSunday = now()->isSunday()
            ? now()
            : now()->next(Carbon::SUNDAY);

        return $query->whereDate('scheduled_date', $nextSunday->toDateString());
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('scheduled_date', '>=', now()->toDateString());
    }

    public function scopeForDate(Builder $query, CarbonInterface $date): Builder
    {
        return $query->where('scheduled_date', $date->toDateString());
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForWeek(Builder $query, CarbonInterface $startOfWeek): Builder
    {
        return $query->whereBetween('scheduled_date', [
            $startOfWeek->toDateString(),
            $startOfWeek->copy()->endOfWeek()->toDateString(),
        ]);
    }

    public function isConfirmed(): bool
    {
        return $this->status === ScheduleStatus::Confirmed;
    }

    public function isDeclined(): bool
    {
        return $this->status === ScheduleStatus::Declined;
    }
}
