<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Member\BookLendingController;
use App\Http\Controllers\Member\CourseEnrollmentController;
use App\Http\Controllers\Member\EventRegistrationController;
use App\Http\Controllers\Member\MinistryEnrollmentController;
use App\Http\Controllers\Member\MyCoursesController;
use App\Http\Controllers\Member\MyEventsController;
use App\Http\Controllers\Member\MyMinistriesController;
use App\Http\Controllers\Member\MyReadingPlansController;
use App\Http\Controllers\Member\NotificationController;
use App\Http\Controllers\Member\ReadingPlanEnrollmentController;
use App\Http\Controllers\Member\VolunteerController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Reading Plan Enrollment & Progress
    Route::post('/reading-plans/{readingPlan}/enroll', [ReadingPlanEnrollmentController::class, 'enroll'])->name('reading-plans.enroll');
    Route::patch('/reading-plans/{readingPlan}/progress/{day}', [ReadingPlanEnrollmentController::class, 'markProgress'])->name('reading-plans.progress');

    // Academy / Courses
    Route::post('/academy/{course}/enroll', [CourseEnrollmentController::class, 'enroll'])->name('courses.enroll');
    Route::get('/academy/{course}/learn/{lesson}', [CourseEnrollmentController::class, 'learn'])->name('courses.learn');
    Route::post('/academy/{course}/lessons/{lesson}/complete', [CourseEnrollmentController::class, 'completeLesson'])->name('courses.lessons.complete');
    Route::get('/academy/quizzes/{quiz}', [CourseEnrollmentController::class, 'quiz'])->name('courses.quiz');
    Route::post('/academy/quizzes/{quiz}/attempt', [CourseEnrollmentController::class, 'submitQuiz'])->name('courses.quiz.submit');
    Route::get('/academy/certificates/{certificate:uuid}', [CourseEnrollmentController::class, 'certificate'])->name('courses.certificate');

    // Events
    Route::post('/events/{event}/rsvp', [EventRegistrationController::class, 'register'])->name('events.register');
    Route::post('/events/{event}/rsvp/cancel', [EventRegistrationController::class, 'cancel'])->name('events.cancel');

    // Ministries
    Route::post('/ministries/{ministry}/join', [MinistryEnrollmentController::class, 'joinMinistry'])->name('ministries.join');
    Route::post('/ministries/{ministry}/leave', [MinistryEnrollmentController::class, 'leaveMinistry'])->name('ministries.leave');
    Route::post('/groups/{ministryGroup}/join', [MinistryEnrollmentController::class, 'joinGroup'])->name('groups.join');
    Route::post('/groups/{ministryGroup}/leave', [MinistryEnrollmentController::class, 'leaveGroup'])->name('groups.leave');

    // My Pages
    Route::get('/my-ministries', MyMinistriesController::class)->name('my-ministries');
    Route::get('/my-events', MyEventsController::class)->name('my-events');
    Route::get('/my-courses', MyCoursesController::class)->name('my-courses');
    Route::get('/my-reading-plans', MyReadingPlansController::class)->name('my-reading-plans');

    // Volunteer Duties
    Route::get('/volunteer/my-duties', [VolunteerController::class, 'myDuties'])->name('volunteer.my-duties');
    Route::post('/volunteer/schedule/{volunteerSchedule}/confirm', [VolunteerController::class, 'confirm'])->name('volunteer.confirm');
    Route::post('/volunteer/schedule/{volunteerSchedule}/decline', [VolunteerController::class, 'decline'])->name('volunteer.decline');

    // Library / My Lendings
    Route::get('/library/my-lendings', [BookLendingController::class, 'index'])->name('books.my-lendings');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllAsRead');
});
