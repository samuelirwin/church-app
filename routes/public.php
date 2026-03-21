<?php

use App\Http\Controllers\HomeController;
use App\Http\Controllers\Public\BookController;
use App\Http\Controllers\Public\CourseController;
use App\Http\Controllers\Public\DocumentController;
use App\Http\Controllers\Public\EventCalendarController;
use App\Http\Controllers\Public\EventCalendarDataController;
use App\Http\Controllers\Public\EventController;
use App\Http\Controllers\Public\FormController;
use App\Http\Controllers\Public\GroupFinderController;
use App\Http\Controllers\Public\HighlightController;
use App\Http\Controllers\Public\MinistryController;
use App\Http\Controllers\Public\PageController;
use App\Http\Controllers\Public\PostController;
use App\Http\Controllers\Public\ReadingPlanController;
use App\Http\Controllers\Public\SeriesController;
use App\Http\Controllers\Public\SermonController;
use App\Http\Controllers\Public\VisitorController;
use App\Http\Controllers\QrCodeController;
use App\Http\Controllers\SearchController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

Route::get('/search', SearchController::class)->name('search');

Route::get('/qr/{path?}', QrCodeController::class)->where('path', '.*')->name('qr.generate');

Route::get('/sermons', [SermonController::class, 'index'])->name('sermons.index');
Route::get('/sermons/{sermon:slug}', [SermonController::class, 'show'])->name('sermons.show');

Route::get('/series', [SeriesController::class, 'index'])->name('series.index');
Route::get('/series/{series:slug}', [SeriesController::class, 'show'])->name('series.show');

Route::get('/updates', [PostController::class, 'index'])->name('posts.index');
Route::get('/updates/{post:slug}', [PostController::class, 'show'])->name('posts.show');

Route::get('/highlights', [HighlightController::class, 'index'])->name('highlights.index');

Route::get('/reading-plans', [ReadingPlanController::class, 'index'])->name('reading-plans.index');
Route::get('/reading-plans/{readingPlan:slug}', [ReadingPlanController::class, 'show'])->name('reading-plans.show');

Route::get('/academy', [CourseController::class, 'index'])->name('courses.index');
Route::get('/academy/{course:slug}', [CourseController::class, 'show'])->name('courses.show');

Route::get('/events', [EventController::class, 'index'])->name('events.index');
Route::get('/events/calendar-data', EventCalendarDataController::class)->name('events.calendar-data');
Route::get('/events/{event:slug}', [EventController::class, 'show'])->name('events.show');
Route::post('/events/{event:slug}/register', [EventController::class, 'register'])->name('events.guest-register');
Route::get('/events/{event:slug}/calendar.ics', EventCalendarController::class)->name('events.calendar');

Route::get('/ministries', [MinistryController::class, 'index'])->name('ministries.index');
Route::get('/ministries/{ministry:slug}', [MinistryController::class, 'show'])->name('ministries.show');
Route::get('/groups/finder', [GroupFinderController::class, 'index'])->name('groups.finder');

Route::get('/documents', [DocumentController::class, 'index'])->name('documents.index');
Route::get('/documents/{document:slug}', [DocumentController::class, 'show'])->name('documents.show');

Route::get('/library', [BookController::class, 'index'])->name('books.index');
Route::get('/library/{book:slug}', [BookController::class, 'show'])->name('books.show');

Route::get('/visit', [VisitorController::class, 'show'])->name('visit');
Route::post('/visit', [VisitorController::class, 'register'])->name('visit.register');

Route::get('/forms/{form:slug}', [FormController::class, 'show'])->name('forms.show');
Route::post('/forms/{form:slug}/submit', [FormController::class, 'submit'])->name('forms.submit');

// Catch-all: resolve CMS pages by slug directly (must remain last)
Route::get('/{page:slug}', [PageController::class, 'show'])
    ->name('pages.show')
    ->where('page', '[a-z0-9]+(?:-[a-z0-9]+)*');
