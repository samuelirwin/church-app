<?php

namespace App\Jobs;

use App\Models\Sermon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Marks the most recent Sunday sermon as "current week" and clears
 * the flag from all other sermons. Intended to run on a weekly schedule (Monday).
 */
class MarkCurrentWeekSermon implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $previousSunday = Carbon::now()->previous(Carbon::SUNDAY);
        $startOfWeek = Carbon::now()->startOfWeek(Carbon::SUNDAY);

        $cleared = Sermon::query()
            ->where('is_current_week', true)
            ->update(['is_current_week' => false]);

        $sermon = Sermon::query()
            ->published()
            ->whereDate('sermon_date', '>=', $startOfWeek)
            ->whereDate('sermon_date', '<=', $previousSunday)
            ->latest('sermon_date')
            ->first();

        if ($sermon) {
            $sermon->update(['is_current_week' => true]);

            Log::info('MarkCurrentWeekSermon: flagged sermon as current week', [
                'sermon_id' => $sermon->id,
                'sermon_title' => $sermon->title,
                'sermon_date' => $sermon->sermon_date->toDateString(),
                'range_start' => $startOfWeek->toDateString(),
                'range_end' => $previousSunday->toDateString(),
                'cleared_count' => $cleared,
            ]);
        } else {
            Log::info('MarkCurrentWeekSermon: no sermon found for current week', [
                'week_start' => $startOfWeek->toDateString(),
                'cleared_count' => $cleared,
            ]);
        }
    }
}
