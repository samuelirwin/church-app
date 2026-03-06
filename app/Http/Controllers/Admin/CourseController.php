<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CourseDifficulty;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCourseModuleRequest;
use App\Http\Requests\Admin\StoreCourseRequest;
use App\Http\Requests\Admin\StoreLessonRequest;
use App\Http\Resources\CourseResource;
use App\Models\Category;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class CourseController extends Controller
{
    /**
     * Display a listing of courses.
     */
    public function index(Request $request): Response
    {
        $courses = Course::query()
            ->withCount(['enrollments', 'lessons'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($request->input('difficulty'), function ($query, $difficulty) {
                $query->where('difficulty', $difficulty);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/courses/index', [
            'courses' => CourseResource::collection($courses),
            'filters' => $request->only(['search', 'difficulty']),
            'difficulties' => collect(CourseDifficulty::cases())->map(fn ($d) => [
                'value' => $d->value,
                'label' => $d->label(),
            ]),
        ]);
    }

    /**
     * Show the form for creating a new course.
     */
    public function create(): Response
    {
        return Inertia::render('admin/courses/create', [
            'categories' => Category::where('type', 'academy')->get(['id', 'name']),
            'difficulties' => collect(CourseDifficulty::cases())->map(fn ($d) => [
                'value' => $d->value,
                'label' => $d->label(),
            ]),
        ]);
    }

    /**
     * Store a newly created course.
     */
    public function store(StoreCourseRequest $request): RedirectResponse
    {
        $course = Course::create([
            ...$request->safe()->except(['cover_image', 'remove_cover', 'library_media_id']),
            'created_by' => $request->user()->id,
        ]);

        if ($request->hasFile('cover_image')) {
            $course->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $sourceMedia->copy($course, 'cover');
            Log::info('Library media copied to course', [
                'course_id' => $course->id,
                'source_media_id' => $libraryMediaId,
            ]);
        }

        Log::info('Course created', [
            'course_id' => $course->id,
            'title' => $course->title,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.courses.show', $course)
            ->with('success', "Course \"{$course->title}\" created. Now add modules and lessons.");
    }

    /**
     * Display the course with module/lesson management.
     */
    public function show(Course $course): Response
    {
        return Inertia::render('admin/courses/modules', [
            'course' => new CourseResource($course->load('modules.lessons')),
        ]);
    }

    /**
     * Show the form for editing the specified course.
     */
    public function edit(Course $course): Response
    {
        return Inertia::render('admin/courses/edit', [
            'course' => new CourseResource($course),
            'categories' => Category::where('type', 'academy')->get(['id', 'name']),
            'difficulties' => collect(CourseDifficulty::cases())->map(fn ($d) => [
                'value' => $d->value,
                'label' => $d->label(),
            ]),
        ]);
    }

    /**
     * Update the specified course.
     */
    public function update(StoreCourseRequest $request, Course $course): RedirectResponse
    {
        $course->update($request->safe()->except(['cover_image', 'remove_cover', 'library_media_id']));

        if ($request->hasFile('cover_image')) {
            $course->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $course->clearMediaCollection('cover');
            $sourceMedia->copy($course, 'cover');
            Log::info('Library media copied to course', [
                'course_id' => $course->id,
                'source_media_id' => $libraryMediaId,
            ]);
        } elseif ($request->boolean('remove_cover')) {
            $course->clearMediaCollection('cover');
        }

        Log::info('Course updated', [
            'course_id' => $course->id,
            'title' => $course->title,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.courses.index')
            ->with('success', "Course \"{$course->title}\" updated.");
    }

    /**
     * Remove the specified course.
     */
    public function destroy(Course $course): RedirectResponse
    {
        $title = $course->title;
        $courseId = $course->id;

        $course->delete();

        Log::info('Course deleted', [
            'course_id' => $courseId,
            'title' => $title,
        ]);

        return redirect()->route('admin.courses.index')
            ->with('success', "Course \"{$title}\" deleted.");
    }

    /**
     * Store a new module for the course.
     */
    public function storeModule(StoreCourseModuleRequest $request, Course $course): RedirectResponse
    {
        $module = $course->modules()->create($request->validated());

        Log::info('Course module added', [
            'course_id' => $course->id,
            'module_id' => $module->id,
            'title' => $module->title,
        ]);

        return redirect()->route('admin.courses.show', $course)
            ->with('success', "Module \"{$module->title}\" added.");
    }

    /**
     * Update a module in the course.
     */
    public function updateModule(StoreCourseModuleRequest $request, Course $course, CourseModule $module): RedirectResponse
    {
        $module->update($request->validated());

        Log::info('Course module updated', [
            'course_id' => $course->id,
            'module_id' => $module->id,
        ]);

        return redirect()->route('admin.courses.show', $course)
            ->with('success', "Module \"{$module->title}\" updated.");
    }

    /**
     * Remove a module from the course.
     */
    public function destroyModule(Course $course, CourseModule $module): RedirectResponse
    {
        $title = $module->title;
        $module->delete();

        Log::info('Course module deleted', [
            'course_id' => $course->id,
            'module_title' => $title,
        ]);

        return redirect()->route('admin.courses.show', $course)
            ->with('success', "Module \"{$title}\" removed.");
    }

    /**
     * Store a new lesson in a module.
     */
    public function storeLesson(StoreLessonRequest $request, Course $course, CourseModule $module): RedirectResponse
    {
        $lesson = $module->lessons()->create($request->validated());

        Log::info('Lesson added', [
            'course_id' => $course->id,
            'module_id' => $module->id,
            'lesson_id' => $lesson->id,
            'title' => $lesson->title,
        ]);

        return redirect()->route('admin.courses.show', $course)
            ->with('success', "Lesson \"{$lesson->title}\" added.");
    }

    /**
     * Update a lesson.
     */
    public function updateLesson(StoreLessonRequest $request, Course $course, CourseModule $module, Lesson $lesson): RedirectResponse
    {
        $lesson->update($request->validated());

        Log::info('Lesson updated', [
            'course_id' => $course->id,
            'lesson_id' => $lesson->id,
        ]);

        return redirect()->route('admin.courses.show', $course)
            ->with('success', "Lesson \"{$lesson->title}\" updated.");
    }

    /**
     * Remove a lesson.
     */
    public function destroyLesson(Course $course, CourseModule $module, Lesson $lesson): RedirectResponse
    {
        $title = $lesson->title;
        $lesson->delete();

        Log::info('Lesson deleted', [
            'course_id' => $course->id,
            'lesson_title' => $title,
        ]);

        return redirect()->route('admin.courses.show', $course)
            ->with('success', "Lesson \"{$title}\" removed.");
    }
}
