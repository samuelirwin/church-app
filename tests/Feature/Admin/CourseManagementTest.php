<?php

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\User;

it('denies member access to course listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.courses.index'))
        ->assertForbidden();
});

it('allows staff to view course listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.courses.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/courses/index')
            ->has('courses')
            ->has('filters')
            ->has('difficulties')
        );
});

it('shows the create course form', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.courses.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/courses/create')
            ->has('difficulties')
        );
});

it('creates a course with valid data', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.courses.store'), [
            'title' => 'Foundations of Faith',
            'description' => '<p>A beginner course on foundational Christian beliefs.</p>',
            'difficulty' => 'beginner',
            'estimated_hours' => '10.5',
            'is_published' => true,
        ])
        ->assertRedirect();

    expect(Course::where('title', 'Foundations of Faith')->exists())->toBeTrue();
});

it('validates required fields when creating a course', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.courses.store'), [])
        ->assertSessionHasErrors(['title', 'difficulty']);
});

it('shows the edit course form', function () {
    $staff = User::factory()->staff()->create();
    $course = Course::factory()->create();

    $this->actingAs($staff)
        ->get(route('admin.courses.edit', $course))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/courses/edit')
            ->has('course')
            ->has('difficulties')
        );
});

it('updates a course', function () {
    $staff = User::factory()->staff()->create();
    $course = Course::factory()->create();

    $this->actingAs($staff)
        ->put(route('admin.courses.update', $course), [
            'title' => 'Updated Course Title',
            'difficulty' => 'intermediate',
        ])
        ->assertRedirect(route('admin.courses.index'));

    expect($course->fresh()->title)->toBe('Updated Course Title');
});

it('deletes a course', function () {
    $staff = User::factory()->staff()->create();
    $course = Course::factory()->create();

    $this->actingAs($staff)
        ->delete(route('admin.courses.destroy', $course))
        ->assertRedirect(route('admin.courses.index'));

    expect(Course::find($course->id))->toBeNull();
});

it('searches courses by title', function () {
    $staff = User::factory()->staff()->create();
    Course::factory()->create(['title' => 'Prayer and Worship']);
    Course::factory()->create(['title' => 'Bible History']);

    $this->actingAs($staff)
        ->get(route('admin.courses.index', ['search' => 'Prayer']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('courses.data', 1)
        );
});

it('shows the module management page', function () {
    $staff = User::factory()->staff()->create();
    $course = Course::factory()->create();

    $this->actingAs($staff)
        ->get(route('admin.courses.show', $course))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/courses/modules')
            ->has('course')
        );
});

it('adds a module to a course', function () {
    $staff = User::factory()->staff()->create();
    $course = Course::factory()->create();

    $this->actingAs($staff)
        ->post(route('admin.courses.modules.store', $course), [
            'title' => 'Introduction Module',
            'sort_order' => 0,
        ])
        ->assertRedirect(route('admin.courses.show', $course));

    expect($course->modules()->count())->toBe(1);
});

it('adds a lesson to a module', function () {
    $staff = User::factory()->staff()->create();
    $course = Course::factory()->create();
    $module = CourseModule::factory()->create(['course_id' => $course->id]);

    $this->actingAs($staff)
        ->post(route('admin.courses.lessons.store', [$course, $module]), [
            'title' => 'What is Theology?',
            'content_type' => 'text',
        ])
        ->assertRedirect(route('admin.courses.show', $course));

    expect($module->lessons()->count())->toBe(1);
});

it('deletes a lesson from a module', function () {
    $staff = User::factory()->staff()->create();
    $course = Course::factory()->create();
    $module = CourseModule::factory()->create(['course_id' => $course->id]);
    $lesson = Lesson::factory()->create(['module_id' => $module->id]);

    $this->actingAs($staff)
        ->delete(route('admin.courses.lessons.destroy', [$course, $module, $lesson]))
        ->assertRedirect(route('admin.courses.show', $course));

    expect(Lesson::find($lesson->id))->toBeNull();
});

it('deletes a module and its lessons', function () {
    $staff = User::factory()->staff()->create();
    $course = Course::factory()->create();
    $module = CourseModule::factory()->create(['course_id' => $course->id]);
    Lesson::factory()->count(2)->create(['module_id' => $module->id]);

    $this->actingAs($staff)
        ->delete(route('admin.courses.modules.destroy', [$course, $module]))
        ->assertRedirect(route('admin.courses.show', $course));

    expect(CourseModule::find($module->id))->toBeNull()
        ->and(Lesson::where('module_id', $module->id)->count())->toBe(0);
});

describe('courses table', function () {
    it('sorts by a whitelisted column and ignores unknown sorts', function () {
        $staff = User::factory()->staff()->create();
        Course::factory()->create(['title' => 'Alpha Course', 'created_at' => now()->subDay()]);
        Course::factory()->create(['title' => 'Zion Walk', 'created_at' => now()->subDays(2)]);

        $this->actingAs($staff)->get(route('admin.courses.index', ['sort' => 'title', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page->where('courses.data.0.title', 'Zion Walk')->where('filters.sort', 'title'));

        $this->actingAs($staff)->get(route('admin.courses.index', ['sort' => 'password', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page->where('courses.data.0.title', 'Alpha Course')->where('filters.sort', null));
    });

    it('filters by several difficulties at once', function () {
        Course::factory()->beginner()->create();
        Course::factory()->advanced()->create();
        Course::factory()->intermediate()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.courses.index', ['difficulty' => ['beginner', 'advanced']]))
            ->assertInertia(fn ($page) => $page
                ->has('courses.data', 2)
                ->where('filters.difficulty', ['beginner', 'advanced']));
    });

    it('still accepts a single difficulty and includes pagination meta', function () {
        Course::factory()->beginner()->count(16)->create();
        Course::factory()->advanced()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.courses.index', ['difficulty' => 'beginner']))
            ->assertInertia(fn ($page) => $page
                ->has('courses.data', 15)
                ->where('courses.meta.total', 16)
                ->where('filters.difficulty', ['beginner']));
    });
});
