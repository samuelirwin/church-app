<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\ReadingPlanEnrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class MyReadingPlansController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $active = ReadingPlanEnrollment::with(['readingPlan:id,title,slug,duration_days'])
            ->withCount('progress')
            ->where('user_id', $user->id)
            ->whereNull('completed_at')
            ->latest('started_at')
            ->get()
            ->map(fn (ReadingPlanEnrollment $e): array => [
                'id' => $e->id,
                'plan_title' => $e->readingPlan->title,
                'plan_slug' => $e->readingPlan->slug,
                'days_completed' => $e->progress_count,
                'total_days' => $e->readingPlan->duration_days,
                'percentage' => $e->completionPercentage(),
                'started_at' => $e->started_at->toDateString(),
            ]);

        $completed = ReadingPlanEnrollment::with(['readingPlan:id,title,slug,duration_days'])
            ->where('user_id', $user->id)
            ->whereNotNull('completed_at')
            ->latest('completed_at')
            ->limit(20)
            ->get()
            ->map(fn (ReadingPlanEnrollment $e): array => [
                'id' => $e->id,
                'plan_title' => $e->readingPlan->title,
                'plan_slug' => $e->readingPlan->slug,
                'total_days' => $e->readingPlan->duration_days,
                'completed_at' => $e->completed_at->toDateString(),
            ]);

        Log::info('My reading plans viewed', [
            'user_id' => $user->id,
            'active_count' => $active->count(),
            'completed_count' => $completed->count(),
        ]);

        return Inertia::render('member/reading-plans/index', [
            'active' => $active,
            'completed' => $completed,
        ]);
    }
}
