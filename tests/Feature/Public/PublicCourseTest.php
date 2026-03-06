<?php

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\User;

it('displays the public academy listing', function () {
    Course::factory()->published()->count(3)->create();

    $this->get(route('courses.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/academy/index')
            ->has('courses.data', 3)
        );
});

it('only shows published courses on public listing', function () {
    Course::factory()->published()->count(2)->create();
    Course::factory()->unpublished()->create();

    $this->get(route('courses.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('courses.data', 2)
        );
});

it('supports search on public academy page', function () {
    Course::factory()->published()->create(['title' => 'Foundations of Faith']);
    Course::factory()->published()->create(['title' => 'Bible Study Methods']);

    $this->get(route('courses.index', ['search' => 'Foundations']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('courses.data', 1)
            ->where('courses.data.0.title', 'Foundations of Faith')
        );
});

it('filters courses by difficulty', function () {
    Course::factory()->published()->beginner()->create();
    Course::factory()->published()->advanced()->create();

    $this->get(route('courses.index', ['difficulty' => 'beginner']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('courses.data', 1)
        );
});

it('displays a published course detail page', function () {
    $course = Course::factory()->published()->create();
    $module = CourseModule::factory()->create(['course_id' => $course->id]);
    Lesson::factory()->count(2)->create(['module_id' => $module->id]);

    $this->get(route('courses.show', $course))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/academy/show')
            ->has('course')
            ->has('enrollment')
            ->has('completedLessonIds')
        );
});

it('returns 404 for unpublished courses', function () {
    $course = Course::factory()->unpublished()->create();

    $this->get(route('courses.show', $course))
        ->assertNotFound();
});

it('includes enrollment data for authenticated users', function () {
    $course = Course::factory()->published()->create();
    $user = User::factory()->create();
    $enrollment = $course->enrollments()->create([
        'user_id' => $user->id,
        'enrolled_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('courses.show', $course))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('enrollment.id', $enrollment->id)
        );
});

it('returns null enrollment for unauthenticated users', function () {
    $course = Course::factory()->published()->create();

    $this->get(route('courses.show', $course))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('enrollment', null)
            ->where('completedLessonIds', [])
        );
});
