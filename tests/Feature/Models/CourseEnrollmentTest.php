<?php

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\User;

it('belongs to a user and a course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $enrollment = CourseEnrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    expect($enrollment->user->id)->toBe($user->id)
        ->and($enrollment->course->id)->toBe($course->id);
});

it('reports isCompleted when completed_at is set', function () {
    $enrollment = CourseEnrollment::factory()->completed()->create();

    expect($enrollment->isCompleted())->toBeTrue();
});

it('reports not completed when completed_at is null', function () {
    $enrollment = CourseEnrollment::factory()->create();

    expect($enrollment->isCompleted())->toBeFalse();
});

it('recalculates progress based on completed lessons', function () {
    $course = Course::factory()->create();
    $module = CourseModule::factory()->create(['course_id' => $course->id]);
    $lessons = Lesson::factory()->count(4)->create(['module_id' => $module->id]);

    $user = User::factory()->create();
    $enrollment = CourseEnrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    // Complete 2 of 4 lessons
    LessonCompletion::create(['user_id' => $user->id, 'lesson_id' => $lessons[0]->id, 'completed_at' => now()]);
    LessonCompletion::create(['user_id' => $user->id, 'lesson_id' => $lessons[1]->id, 'completed_at' => now()]);

    $enrollment->recalculateProgress();

    expect($enrollment->fresh()->progress_percentage)->toBe(50);
});

it('auto-completes enrollment when all lessons are done', function () {
    $course = Course::factory()->create();
    $module = CourseModule::factory()->create(['course_id' => $course->id]);
    $lessons = Lesson::factory()->count(2)->create(['module_id' => $module->id]);

    $user = User::factory()->create();
    $enrollment = CourseEnrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    // Complete all lessons
    foreach ($lessons as $lesson) {
        LessonCompletion::create(['user_id' => $user->id, 'lesson_id' => $lesson->id, 'completed_at' => now()]);
    }

    $enrollment->recalculateProgress();

    expect($enrollment->fresh()->progress_percentage)->toBe(100)
        ->and($enrollment->fresh()->completed_at)->not->toBeNull();
});

it('casts enrolled_at and completed_at as datetime', function () {
    $enrollment = CourseEnrollment::factory()->completed()->create();

    expect($enrollment->enrolled_at)->toBeInstanceOf(\DateTimeInterface::class)
        ->and($enrollment->completed_at)->toBeInstanceOf(\DateTimeInterface::class);
});
