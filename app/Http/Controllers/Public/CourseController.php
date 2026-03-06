<?php

namespace App\Http\Controllers\Public;

use App\Enums\CourseDifficulty;
use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Models\Category;
use App\Models\Course;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    /**
     * Display a listing of published courses.
     */
    public function index(Request $request): Response
    {
        $courses = Course::query()
            ->published()
            ->withCount(['enrollments', 'lessons'])
            ->with('media', 'category')
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($request->input('difficulty'), function ($query, $difficulty) {
                $query->where('difficulty', $difficulty);
            })
            ->when($request->input('category'), function ($query, $categorySlug) {
                $query->whereHas('category', function ($q) use ($categorySlug) {
                    $q->where('slug', $categorySlug);
                });
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('public/academy/index', [
            'courses' => CourseResource::collection($courses),
            'filters' => $request->only(['search', 'difficulty', 'category']),
            'difficulties' => collect(CourseDifficulty::cases())->map(fn ($d) => [
                'value' => $d->value,
                'label' => $d->label(),
            ]),
            'categories' => Category::where('type', 'academy')->get(['id', 'name', 'slug']),
        ]);
    }

    /**
     * Display the specified published course.
     */
    public function show(Course $course): Response
    {
        abort_unless($course->is_published, 404);

        $course->load(['modules.lessons', 'media', 'category']);
        $course->loadCount(['enrollments', 'lessons']);

        $enrollment = null;
        $completedLessonIds = [];

        if (auth()->check()) {
            $enrollment = $course->enrollments()
                ->where('user_id', auth()->id())
                ->first();

            if ($enrollment) {
                $completedLessonIds = \App\Models\LessonCompletion::where('user_id', auth()->id())
                    ->whereIn('lesson_id', $course->lessons()->pluck('lessons.id'))
                    ->pluck('lesson_id')
                    ->toArray();
            }
        }

        return Inertia::render('public/academy/show', [
            'course' => new CourseResource($course),
            'enrollment' => $enrollment ? [
                'id' => $enrollment->id,
                'enrolled_at' => $enrollment->enrolled_at,
                'completed_at' => $enrollment->completed_at,
                'progress_percentage' => $enrollment->progress_percentage,
            ] : null,
            'completedLessonIds' => $completedLessonIds,
        ]);
    }
}
