<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\CourseEnrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class MyCoursesController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $active = CourseEnrollment::with('course:id,title,slug,difficulty,estimated_hours')
            ->where('user_id', $user->id)
            ->whereNull('completed_at')
            ->latest('enrolled_at')
            ->get()
            ->map(fn (CourseEnrollment $e): array => [
                'id' => $e->id,
                'course_title' => $e->course->title,
                'course_slug' => $e->course->slug,
                'difficulty' => $e->course->difficulty->value,
                'estimated_hours' => $e->course->estimated_hours,
                'progress' => $e->progress_percentage,
                'enrolled_at' => $e->enrolled_at->toDateString(),
            ]);

        $completed = CourseEnrollment::with('course:id,title,slug,difficulty')
            ->where('user_id', $user->id)
            ->whereNotNull('completed_at')
            ->latest('completed_at')
            ->limit(20)
            ->get()
            ->map(fn (CourseEnrollment $e): array => [
                'id' => $e->id,
                'course_title' => $e->course->title,
                'course_slug' => $e->course->slug,
                'difficulty' => $e->course->difficulty->value,
                'completed_at' => $e->completed_at->toDateString(),
            ]);

        Log::info('My courses viewed', [
            'user_id' => $user->id,
            'active_count' => $active->count(),
            'completed_count' => $completed->count(),
        ]);

        return Inertia::render('member/courses/index', [
            'active' => $active,
            'completed' => $completed,
        ]);
    }
}
