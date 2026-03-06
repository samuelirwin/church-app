<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Http\Resources\LessonResource;
use App\Http\Resources\QuizQuestionResource;
use App\Http\Resources\QuizResource;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class CourseEnrollmentController extends Controller
{
    /**
     * Enroll the authenticated user in a course.
     */
    public function enroll(Request $request, Course $course): RedirectResponse
    {
        abort_unless($course->is_published, 404);

        $existing = $course->enrollments()
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            return back()->with('info', 'You are already enrolled in this course.');
        }

        if ($course->max_enrollments && $course->enrollments()->count() >= $course->max_enrollments) {
            return back()->with('error', 'This course has reached its enrollment limit.');
        }

        $enrollment = $course->enrollments()->create([
            'user_id' => $request->user()->id,
            'enrolled_at' => now(),
        ]);

        Log::info('User enrolled in course', [
            'user_id' => $request->user()->id,
            'course_id' => $course->id,
            'enrollment_id' => $enrollment->id,
        ]);

        return back()->with('success', "Enrolled in \"{$course->title}\".");
    }

    /**
     * Display the lesson viewer.
     */
    public function learn(Request $request, Course $course, Lesson $lesson): Response
    {
        $enrollment = $course->enrollments()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $course->load('modules.lessons');

        $isCompleted = LessonCompletion::where('user_id', $request->user()->id)
            ->where('lesson_id', $lesson->id)
            ->exists();

        $completedLessonIds = LessonCompletion::where('user_id', $request->user()->id)
            ->whereIn('lesson_id', $course->lessons()->pluck('lessons.id'))
            ->pluck('lesson_id')
            ->toArray();

        return Inertia::render('member/academy/learn', [
            'course' => new CourseResource($course),
            'lesson' => new LessonResource($lesson),
            'isCompleted' => $isCompleted,
            'completedLessonIds' => $completedLessonIds,
            'enrollment' => [
                'id' => $enrollment->id,
                'progress_percentage' => $enrollment->progress_percentage,
            ],
        ]);
    }

    /**
     * Mark a lesson as complete.
     */
    public function completeLesson(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $enrollment = $course->enrollments()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $existing = LessonCompletion::where('user_id', $request->user()->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        if ($existing) {
            return back()->with('info', 'Lesson already completed.');
        }

        LessonCompletion::create([
            'user_id' => $request->user()->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now(),
        ]);

        $enrollment->recalculateProgress();

        Log::info('Lesson completed', [
            'user_id' => $request->user()->id,
            'course_id' => $course->id,
            'lesson_id' => $lesson->id,
            'progress' => $enrollment->fresh()->progress_percentage.'%',
        ]);

        if ($enrollment->fresh()->isCompleted()) {
            // Issue certificate
            $certificate = Certificate::create([
                'user_id' => $request->user()->id,
                'course_id' => $course->id,
                'issued_at' => now(),
            ]);

            Log::info('Course completed, certificate issued', [
                'user_id' => $request->user()->id,
                'course_id' => $course->id,
                'certificate_id' => $certificate->id,
            ]);

            return back()->with('success', 'Congratulations! You have completed this course!');
        }

        return back()->with('success', 'Lesson completed.');
    }

    /**
     * Display a quiz for the user to attempt.
     */
    public function quiz(Request $request, Quiz $quiz): Response
    {
        $quiz->load('questions');
        $quiz->loadCount('questions');

        $userAttempts = $quiz->attempts()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return Inertia::render('member/academy/quiz', [
            'quiz' => new QuizResource($quiz),
            'questions' => QuizQuestionResource::collection($quiz->questions),
            'attempts' => $userAttempts->map(fn ($a) => [
                'id' => $a->id,
                'score' => $a->score,
                'passed' => $a->passed,
                'completed_at' => $a->completed_at,
            ]),
            'canAttempt' => ! $quiz->max_attempts || $userAttempts->count() < $quiz->max_attempts,
        ]);
    }

    /**
     * Submit a quiz attempt.
     */
    public function submitQuiz(Request $request, Quiz $quiz): RedirectResponse
    {
        $request->validate([
            'answers' => ['required', 'array'],
        ]);

        if ($quiz->max_attempts) {
            $existingAttempts = $quiz->attempts()
                ->where('user_id', $request->user()->id)
                ->count();

            if ($existingAttempts >= $quiz->max_attempts) {
                return back()->with('error', 'Maximum attempts reached.');
            }
        }

        $quiz->load('questions');
        $answers = $request->input('answers');
        $totalPoints = 0;
        $earnedPoints = 0;

        foreach ($quiz->questions as $question) {
            $totalPoints += $question->points;
            $userAnswer = $answers[$question->id] ?? null;

            if ($userAnswer !== null && $question->correct_answer === $userAnswer) {
                $earnedPoints += $question->points;
            }
        }

        $score = $totalPoints > 0 ? (int) round(($earnedPoints / $totalPoints) * 100) : 0;
        $passed = $score >= $quiz->passing_score;

        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => $request->user()->id,
            'answers' => $answers,
            'score' => $score,
            'passed' => $passed,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        Log::info('Quiz attempt submitted', [
            'user_id' => $request->user()->id,
            'quiz_id' => $quiz->id,
            'attempt_id' => $attempt->id,
            'score' => $score,
            'passed' => $passed,
        ]);

        $message = $passed
            ? "You passed with a score of {$score}%!"
            : "You scored {$score}%. You need {$quiz->passing_score}% to pass.";

        return back()->with($passed ? 'success' : 'info', $message);
    }

    /**
     * View a certificate.
     */
    public function certificate(Certificate $certificate): Response
    {
        $certificate->load(['user', 'course']);

        return Inertia::render('member/academy/certificate', [
            'certificate' => [
                'uuid' => $certificate->uuid,
                'certificate_number' => $certificate->certificate_number,
                'issued_at' => $certificate->issued_at,
                'user_name' => $certificate->user->name,
                'course_title' => $certificate->course->title,
            ],
        ]);
    }
}
