<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReadingPlanResource;
use App\Models\ReadingPlan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReadingPlanController extends Controller
{
    /**
     * Display a listing of published reading plans.
     */
    public function index(Request $request): Response
    {
        $plans = ReadingPlan::query()
            ->published()
            ->withCount('enrollments')
            ->with('media')
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('public/reading-plans/index', [
            'plans' => ReadingPlanResource::collection($plans),
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Display the specified published reading plan.
     */
    public function show(ReadingPlan $readingPlan): Response
    {
        abort_unless($readingPlan->is_published, 404);

        $readingPlan->load(['days', 'media']);
        $readingPlan->loadCount('enrollments');

        $enrollment = null;
        $completedDayIds = [];

        if (auth()->check()) {
            $enrollment = $readingPlan->enrollments()
                ->where('user_id', auth()->id())
                ->first();

            if ($enrollment) {
                $completedDayIds = $enrollment->progress()->pluck('day_id')->toArray();
            }
        }

        return Inertia::render('public/reading-plans/show', [
            'plan' => new ReadingPlanResource($readingPlan),
            'enrollment' => $enrollment ? [
                'id' => $enrollment->id,
                'started_at' => $enrollment->started_at,
                'completed_at' => $enrollment->completed_at,
                'completion_percentage' => $enrollment->completionPercentage(),
            ] : null,
            'completedDayIds' => $completedDayIds,
        ]);
    }
}
