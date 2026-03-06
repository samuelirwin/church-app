<?php

use App\Models\Certificate;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\User;

it('requires authentication to enroll in a course', function () {
    $course = Course::factory()->published()->create();

    $this->post(route('courses.enroll', $course))
        ->assertRedirect(route('login'));
});

it('enrolls a user in a published course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->published()->create();

    $this->actingAs($user)
        ->post(route('courses.enroll', $course))
        ->assertRedirect();

    expect($course->enrollments()->where('user_id', $user->id)->exists())->toBeTrue();
});

it('prevents duplicate enrollment in the same course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->published()->create();
    $course->enrollments()->create([
        'user_id' => $user->id,
        'enrolled_at' => now(),
    ]);

    $this->actingAs($user)
        ->post(route('courses.enroll', $course))
        ->assertRedirect();

    expect($course->enrollments()->where('user_id', $user->id)->count())->toBe(1);
});

it('returns 404 when enrolling in unpublished course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->unpublished()->create();

    $this->actingAs($user)
        ->post(route('courses.enroll', $course))
        ->assertNotFound();
});

it('respects max enrollment limit', function () {
    $course = Course::factory()->published()->create(['max_enrollments' => 1]);
    $course->enrollments()->create([
        'user_id' => User::factory()->create()->id,
        'enrolled_at' => now(),
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('courses.enroll', $course))
        ->assertRedirect();

    expect($course->enrollments()->where('user_id', $user->id)->exists())->toBeFalse();
});

it('displays the lesson viewer for enrolled user', function () {
    $user = User::factory()->create();
    $course = Course::factory()->published()->create();
    $module = CourseModule::factory()->create(['course_id' => $course->id]);
    $lesson = Lesson::factory()->create(['module_id' => $module->id]);
    $course->enrollments()->create([
        'user_id' => $user->id,
        'enrolled_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('courses.learn', [$course, $lesson]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('member/academy/learn')
            ->has('course')
            ->has('lesson')
            ->has('completedLessonIds')
        );
});

it('marks a lesson as complete', function () {
    $user = User::factory()->create();
    $course = Course::factory()->published()->create();
    $module = CourseModule::factory()->create(['course_id' => $course->id]);
    $lesson = Lesson::factory()->create(['module_id' => $module->id]);
    $course->enrollments()->create([
        'user_id' => $user->id,
        'enrolled_at' => now(),
    ]);

    $this->actingAs($user)
        ->post(route('courses.lessons.complete', [$course, $lesson]))
        ->assertRedirect();

    expect(\App\Models\LessonCompletion::where('user_id', $user->id)->where('lesson_id', $lesson->id)->exists())->toBeTrue();
});

it('issues certificate when all lessons are completed', function () {
    $user = User::factory()->create();
    $course = Course::factory()->published()->create();
    $module = CourseModule::factory()->create(['course_id' => $course->id]);
    $lesson = Lesson::factory()->create(['module_id' => $module->id]);
    $course->enrollments()->create([
        'user_id' => $user->id,
        'enrolled_at' => now(),
    ]);

    $this->actingAs($user)
        ->post(route('courses.lessons.complete', [$course, $lesson]))
        ->assertRedirect();

    expect(Certificate::where('user_id', $user->id)->where('course_id', $course->id)->exists())->toBeTrue();
});

it('prevents marking the same lesson complete twice', function () {
    $user = User::factory()->create();
    $course = Course::factory()->published()->create();
    $module = CourseModule::factory()->create(['course_id' => $course->id]);
    $lesson = Lesson::factory()->create(['module_id' => $module->id]);
    $course->enrollments()->create([
        'user_id' => $user->id,
        'enrolled_at' => now(),
    ]);

    // Complete once
    $this->actingAs($user)->post(route('courses.lessons.complete', [$course, $lesson]));

    // Complete again
    $this->actingAs($user)
        ->post(route('courses.lessons.complete', [$course, $lesson]))
        ->assertRedirect();

    expect(\App\Models\LessonCompletion::where('user_id', $user->id)->where('lesson_id', $lesson->id)->count())->toBe(1);
});

it('submits a quiz attempt and calculates score', function () {
    $user = User::factory()->create();
    $course = Course::factory()->published()->create();
    $module = CourseModule::factory()->create(['course_id' => $course->id]);
    $lesson = Lesson::factory()->create(['module_id' => $module->id]);
    $quiz = Quiz::factory()->create(['lesson_id' => $lesson->id, 'passing_score' => 50]);
    $question = QuizQuestion::factory()->create([
        'quiz_id' => $quiz->id,
        'correct_answer' => ['Option A'],
        'points' => 1,
    ]);

    $this->actingAs($user)
        ->post(route('courses.quiz.submit', $quiz), [
            'answers' => [$question->id => ['Option A']],
        ])
        ->assertRedirect();

    expect($quiz->attempts()->where('user_id', $user->id)->first())
        ->score->toBe(100)
        ->passed->toBeTrue();
});

it('fails quiz when score is below passing', function () {
    $user = User::factory()->create();
    $quiz = Quiz::factory()->create(['passing_score' => 80]);
    $question = QuizQuestion::factory()->create([
        'quiz_id' => $quiz->id,
        'correct_answer' => ['Option A'],
        'points' => 1,
    ]);

    $this->actingAs($user)
        ->post(route('courses.quiz.submit', $quiz), [
            'answers' => [$question->id => ['Option B']],
        ])
        ->assertRedirect();

    expect($quiz->attempts()->where('user_id', $user->id)->first())
        ->score->toBe(0)
        ->passed->toBeFalse();
});

it('respects max quiz attempts', function () {
    $user = User::factory()->create();
    $quiz = Quiz::factory()->create(['max_attempts' => 1]);
    $question = QuizQuestion::factory()->create(['quiz_id' => $quiz->id]);

    // First attempt with actual answers so validation passes
    $this->actingAs($user)
        ->post(route('courses.quiz.submit', $quiz), [
            'answers' => [$question->id => ['Wrong Answer']],
        ]);

    // Second attempt should be blocked
    $this->actingAs($user)
        ->post(route('courses.quiz.submit', $quiz), [
            'answers' => [$question->id => ['Wrong Answer']],
        ])
        ->assertRedirect();

    expect($quiz->attempts()->where('user_id', $user->id)->count())->toBe(1);
});

it('displays a certificate', function () {
    $user = User::factory()->create();
    $certificate = Certificate::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('courses.certificate', $certificate))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('member/academy/certificate')
            ->has('certificate')
        );
});
