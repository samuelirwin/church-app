<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\BenevolentRequestController;
use App\Http\Controllers\Admin\BookController;
use App\Http\Controllers\Admin\CounselingCaseController;
use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\DocumentController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\ExportController;
use App\Http\Controllers\Admin\FormController;
use App\Http\Controllers\Admin\HeroSlideController;
use App\Http\Controllers\Admin\HighlightController;
use App\Http\Controllers\Admin\MediaLibraryController;
use App\Http\Controllers\Admin\MenuItemController;
use App\Http\Controllers\Admin\MinistryController;
use App\Http\Controllers\Admin\MinistryGroupController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\ReadingPlanController;
use App\Http\Controllers\Admin\SermonController;
use App\Http\Controllers\Admin\SermonSeriesController;
use App\Http\Controllers\Admin\ServiceTimeController;
use App\Http\Controllers\Admin\SiteSettingController;
use App\Http\Controllers\Admin\SpeakerController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VisitorController;
use App\Http\Controllers\Admin\VolunteerRoleController;
use App\Http\Controllers\Admin\VolunteerScheduleController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin,staff,leader'])->prefix('admin')->name('admin.')->group(function () {
    // User management (admin only via controller authorization)
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
    Route::patch('users/{user}', [UserController::class, 'update'])->name('users.update');

    // Sermons
    Route::resource('sermons', SermonController::class);

    // Speakers
    Route::resource('speakers', SpeakerController::class);

    // Sermon Series
    Route::resource('series', SermonSeriesController::class)->parameters(['series' => 'series']);

    // Posts
    Route::resource('posts', PostController::class);

    // Highlights
    Route::resource('highlights', HighlightController::class);

    // Reading Plans
    Route::resource('reading-plans', ReadingPlanController::class)->parameters(['reading-plans' => 'readingPlan']);
    Route::post('reading-plans/{readingPlan}/days', [ReadingPlanController::class, 'storeDay'])->name('reading-plans.days.store');
    Route::put('reading-plans/{readingPlan}/days/{day}', [ReadingPlanController::class, 'updateDay'])->name('reading-plans.days.update');
    Route::delete('reading-plans/{readingPlan}/days/{day}', [ReadingPlanController::class, 'destroyDay'])->name('reading-plans.days.destroy');

    // Forms
    Route::resource('forms', FormController::class);
    Route::get('forms/{form}/responses', [FormController::class, 'responses'])->name('forms.responses');

    // Books
    Route::resource('books', BookController::class);
    Route::get('books-lendings', [BookController::class, 'lendings'])->name('books.lendings');
    Route::post('books/{book}/lend', [BookController::class, 'lend'])->name('books.lend');
    Route::patch('lendings/{lending}/return', [BookController::class, 'returnBook'])->name('lendings.return');

    // Events
    Route::resource('events', EventController::class);
    Route::get('events/{event}/registrations', [EventController::class, 'registrations'])->name('events.registrations');

    // Ministries
    Route::resource('ministries', MinistryController::class);
    Route::get('ministries/{ministry}/members', [MinistryController::class, 'members'])->name('ministries.members');

    // Ministry Groups
    Route::resource('ministry-groups', MinistryGroupController::class);
    Route::get('ministry-groups/{ministryGroup}/members', [MinistryGroupController::class, 'members'])->name('ministry-groups.members');

    // Service Times (index redirects to Site Settings)
    Route::get('service-times', fn () => redirect()->route('admin.site-settings.edit'))->name('service-times.index');
    Route::resource('service-times', ServiceTimeController::class)->except(['index', 'show']);

    // Volunteer Roles (index redirects to Site Settings)
    Route::get('volunteer-roles', fn () => redirect()->route('admin.site-settings.edit'))->name('volunteer-roles.index');
    Route::resource('volunteer-roles', VolunteerRoleController::class)->except(['index', 'show']);

    // Volunteer Roster
    Route::get('volunteer/roster', [VolunteerScheduleController::class, 'index'])->name('volunteer.roster');
    Route::post('volunteer/schedule', [VolunteerScheduleController::class, 'store'])->name('volunteer.schedule.store');
    Route::post('volunteer/schedule/bulk', [VolunteerScheduleController::class, 'bulkStore'])->name('volunteer.schedule.bulk');
    Route::put('volunteer/schedule/{volunteerSchedule}', [VolunteerScheduleController::class, 'update'])->name('volunteer.schedule.update');
    Route::delete('volunteer/schedule/{volunteerSchedule}', [VolunteerScheduleController::class, 'destroy'])->name('volunteer.schedule.destroy');

    // Visitors
    Route::get('visitors', [VisitorController::class, 'index'])->name('visitors.index');
    Route::get('visitors/{visitor}', [VisitorController::class, 'show'])->name('visitors.show');
    Route::patch('visitors/{visitor}', [VisitorController::class, 'update'])->name('visitors.update');
    Route::delete('visitors/{visitor}', [VisitorController::class, 'destroy'])->name('visitors.destroy');
    Route::post('visitors/{visitor}/follow-up', [VisitorController::class, 'addFollowUp'])->name('visitors.follow-up');
    Route::post('visitors/{visitor}/convert', [VisitorController::class, 'convert'])->name('visitors.convert');

    // Menu Items (index redirects to Site Settings)
    Route::get('menu-items', fn () => redirect()->route('admin.site-settings.edit'))->name('menu-items.index');
    Route::resource('menu-items', MenuItemController::class)->except(['index', 'show']);

    // Site Settings (admin only via form request authorization)
    Route::get('site-settings', [SiteSettingController::class, 'edit'])->name('site-settings.edit');
    Route::put('site-settings', [SiteSettingController::class, 'update'])->name('site-settings.update');

    // Hero Slides (managed inside Site Settings hero tab)
    Route::redirect('hero-slides', '/admin/site-settings')->name('hero-slides.index');
    Route::resource('hero-slides', HeroSlideController::class)->except(['index', 'show']);

    // Documents
    Route::resource('documents', DocumentController::class);

    // Pages
    Route::resource('pages', PageController::class);

    // Media Library
    Route::get('media-library', [MediaLibraryController::class, 'index'])->name('media-library.index');

    // Benevolent Requests
    Route::get('benevolent-requests', [BenevolentRequestController::class, 'index'])->name('benevolent-requests.index');
    Route::get('benevolent-requests/create', [BenevolentRequestController::class, 'create'])->name('benevolent-requests.create');
    Route::post('benevolent-requests', [BenevolentRequestController::class, 'store'])->name('benevolent-requests.store');
    Route::get('benevolent-requests/{benevolentRequest}', [BenevolentRequestController::class, 'show'])->name('benevolent-requests.show');
    Route::post('benevolent-requests/{benevolentRequest}/review', [BenevolentRequestController::class, 'addReview'])->name('benevolent-requests.review');
    Route::post('benevolent-requests/{benevolentRequest}/decide', [BenevolentRequestController::class, 'decide'])->name('benevolent-requests.decide');
    Route::post('benevolent-requests/{benevolentRequest}/disburse', [BenevolentRequestController::class, 'disburse'])->name('benevolent-requests.disburse');
    Route::post('benevolent-requests/{benevolentRequest}/attachments', [BenevolentRequestController::class, 'addAttachments'])->name('benevolent-requests.attachments');
    Route::delete('benevolent-requests/{benevolentRequest}', [BenevolentRequestController::class, 'destroy'])->name('benevolent-requests.destroy');

    // Counseling Cases
    Route::get('counseling-cases', [CounselingCaseController::class, 'index'])->name('counseling-cases.index');
    Route::get('counseling-cases/create', [CounselingCaseController::class, 'create'])->name('counseling-cases.create');
    Route::post('counseling-cases', [CounselingCaseController::class, 'store'])->name('counseling-cases.store');
    Route::get('counseling-cases/{counselingCase}', [CounselingCaseController::class, 'show'])->name('counseling-cases.show');
    Route::get('counseling-cases/{counselingCase}/edit', [CounselingCaseController::class, 'edit'])->name('counseling-cases.edit');
    Route::put('counseling-cases/{counselingCase}', [CounselingCaseController::class, 'update'])->name('counseling-cases.update');
    Route::delete('counseling-cases/{counselingCase}', [CounselingCaseController::class, 'destroy'])->name('counseling-cases.destroy');
    Route::post('counseling-cases/{counselingCase}/sessions', [CounselingCaseController::class, 'addSession'])->name('counseling-cases.sessions');
    Route::post('counseling-cases/{counselingCase}/goals', [CounselingCaseController::class, 'addGoal'])->name('counseling-cases.goals.store');
    Route::put('counseling-cases/{counselingCase}/goals/{goal}', [CounselingCaseController::class, 'updateGoal'])->name('counseling-cases.goals.update');
    Route::post('counseling-cases/{counselingCase}/referrals', [CounselingCaseController::class, 'addReferral'])->name('counseling-cases.referrals');
    Route::post('counseling-cases/{counselingCase}/attachments', [CounselingCaseController::class, 'addAttachments'])->name('counseling-cases.attachments');

    // Exports
    Route::prefix('exports')->name('exports.')->group(function () {
        Route::get('users', [ExportController::class, 'users'])->name('users');
        Route::get('events/{event}/registrations', [ExportController::class, 'eventRegistrations'])->name('event-registrations');
        Route::get('forms/{form}/responses', [ExportController::class, 'formResponses'])->name('form-responses');
        Route::get('visitors', [ExportController::class, 'visitors'])->name('visitors');
        Route::get('book-lendings', [ExportController::class, 'bookLendings'])->name('book-lendings');
        Route::get('benevolent-requests', [ExportController::class, 'benevolentRequests'])->name('benevolent-requests');
        Route::get('counseling-cases', [ExportController::class, 'counselingCases'])->name('counseling-cases');
    });

    // Analytics
    Route::get('analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
    Route::get('analytics/membership-growth', [AnalyticsController::class, 'membershipGrowth'])->name('analytics.membership-growth');
    Route::get('analytics/event-attendance', [AnalyticsController::class, 'eventAttendance'])->name('analytics.event-attendance');
    Route::get('analytics/ministry-distribution', [AnalyticsController::class, 'ministryDistribution'])->name('analytics.ministry-distribution');
    Route::get('analytics/course-metrics', [AnalyticsController::class, 'courseMetrics'])->name('analytics.course-metrics');
    Route::get('analytics/visitor-funnel', [AnalyticsController::class, 'visitorFunnel'])->name('analytics.visitor-funnel');
    Route::get('analytics/benevolence-overview', [AnalyticsController::class, 'benevolenceOverview'])->name('analytics.benevolence-overview');

    // Courses
    Route::resource('courses', CourseController::class);
    Route::post('courses/{course}/modules', [CourseController::class, 'storeModule'])->name('courses.modules.store');
    Route::put('courses/{course}/modules/{module}', [CourseController::class, 'updateModule'])->name('courses.modules.update');
    Route::delete('courses/{course}/modules/{module}', [CourseController::class, 'destroyModule'])->name('courses.modules.destroy');
    Route::post('courses/{course}/modules/{module}/lessons', [CourseController::class, 'storeLesson'])->name('courses.lessons.store');
    Route::put('courses/{course}/modules/{module}/lessons/{lesson}', [CourseController::class, 'updateLesson'])->name('courses.lessons.update');
    Route::delete('courses/{course}/modules/{module}/lessons/{lesson}', [CourseController::class, 'destroyLesson'])->name('courses.lessons.destroy');
});
