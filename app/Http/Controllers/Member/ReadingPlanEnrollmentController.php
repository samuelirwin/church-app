<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\ReadingPlan;
use App\Models\ReadingPlanDay;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ReadingPlanEnrollmentController extends Controller
{
    /**
     * Enroll the authenticated user in a reading plan.
     */
    public function enroll(Request $request, ReadingPlan $readingPlan): RedirectResponse
    {
        abort_unless($readingPlan->is_published, 404);

        $existing = $readingPlan->enrollments()
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            return back()->with('info', 'You are already enrolled in this plan.');
        }

        $enrollment = $readingPlan->enrollments()->create([
            'user_id' => $request->user()->id,
            'started_at' => now(),
        ]);

        Log::info('User enrolled in reading plan', [
            'user_id' => $request->user()->id,
            'plan_id' => $readingPlan->id,
            'enrollment_id' => $enrollment->id,
        ]);

        return back()->with('success', "Enrolled in \"{$readingPlan->title}\".");
    }

    /**
     * Mark a day as complete for the authenticated user's enrollment.
     */
    public function markProgress(Request $request, ReadingPlan $readingPlan, ReadingPlanDay $day): RedirectResponse
    {
        $enrollment = $readingPlan->enrollments()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $existingProgress = $enrollment->progress()
            ->where('day_id', $day->id)
            ->first();

        if ($existingProgress) {
            return back()->with('info', 'This day is already completed.');
        }

        $enrollment->progress()->create([
            'day_id' => $day->id,
            'completed_at' => now(),
        ]);

        // Check if plan is now fully complete
        $totalDays = $readingPlan->duration_days;
        $completedDays = $enrollment->progress()->count();

        if ($completedDays >= $totalDays) {
            $enrollment->update(['completed_at' => now()]);

            Log::info('User completed reading plan', [
                'user_id' => $request->user()->id,
                'plan_id' => $readingPlan->id,
                'enrollment_id' => $enrollment->id,
            ]);

            return back()->with('success', 'You have completed this reading plan!');
        }

        Log::info('Reading plan day completed', [
            'user_id' => $request->user()->id,
            'plan_id' => $readingPlan->id,
            'day_id' => $day->id,
            'progress' => "{$completedDays}/{$totalDays}",
        ]);

        return back()->with('success', "Day {$day->day_number} completed.");
    }
}
