<?php

use App\Enums\CourseDifficulty;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\User;

it('auto-generates slug from title on creation', function () {
    $course = Course::factory()->create(['title' => 'Introduction to Theology']);

    expect($course->slug)->toBe('introduction-to-theology');
});

it('scopes to published courses only', function () {
    Course::factory()->published()->create();
    Course::factory()->unpublished()->create();

    expect(Course::published()->count())->toBe(1);
});

it('belongs to a creator', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['created_by' => $user->id]);

    expect($course->creator->id)->toBe($user->id);
});

it('casts difficulty to CourseDifficulty enum', function () {
    $course = Course::factory()->beginner()->create();

    expect($course->difficulty)->toBe(CourseDifficulty::Beginner);
});

it('has many modules ordered by sort_order', function () {
    $course = Course::factory()->create();
    CourseModule::factory()->create(['course_id' => $course->id, 'sort_order' => 2]);
    CourseModule::factory()->create(['course_id' => $course->id, 'sort_order' => 0]);
    CourseModule::factory()->create(['course_id' => $course->id, 'sort_order' => 1]);

    $modules = $course->modules;

    expect($modules)->toHaveCount(3)
        ->and($modules->first()->sort_order)->toBe(0)
        ->and($modules->last()->sort_order)->toBe(2);
});

it('has lessons through modules', function () {
    $course = Course::factory()->create();
    $module = CourseModule::factory()->create(['course_id' => $course->id]);
    Lesson::factory()->count(3)->create(['module_id' => $module->id]);

    expect($course->lessons)->toHaveCount(3);
});

it('reports isPublished correctly', function () {
    $published = Course::factory()->published()->create();
    $draft = Course::factory()->unpublished()->create();

    expect($published->isPublished())->toBeTrue()
        ->and($draft->isPublished())->toBeFalse();
});

it('casts is_published as boolean', function () {
    $course = Course::factory()->create();

    expect($course->is_published)->toBeBool();
});

it('counts total lessons across all modules', function () {
    $course = Course::factory()->create();
    $mod1 = CourseModule::factory()->create(['course_id' => $course->id]);
    $mod2 = CourseModule::factory()->create(['course_id' => $course->id]);
    Lesson::factory()->count(2)->create(['module_id' => $mod1->id]);
    Lesson::factory()->count(3)->create(['module_id' => $mod2->id]);

    expect($course->totalLessons())->toBe(5);
});
