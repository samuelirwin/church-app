<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\AttendanceController;
use App\Http\Controllers\Admin\BenevolentRequestController;
use App\Http\Controllers\Admin\BookController;
use App\Http\Controllers\Admin\CareNeedController;
use App\Http\Controllers\Admin\CounselingCaseController;
use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DocumentController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\ExportController;
use App\Http\Controllers\Admin\FormController;
use App\Http\Controllers\Admin\HeroSlideController;
use App\Http\Controllers\Admin\HighlightController;
use App\Http\Controllers\Admin\HouseholdController;
use App\Http\Controllers\Admin\MediaLibraryController;
use App\Http\Controllers\Admin\MemberController;
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
    // ── Admin-only routes ──────────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        // User management
        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::patch('users/{user}', [UserController::class, 'update'])->name('users.update');

        // Site Settings
        Route::get('site-settings', [SiteSettingController::class, 'edit'])->name('site-settings.edit');
        Route::put('site-settings', [SiteSettingController::class, 'update'])->name('site-settings.update');

        // Hero Slides
        Route::redirect('hero-slides', '/admin/site-settings')->name('hero-slides.index');
        Route::resource('hero-slides', HeroSlideController::class)->except(['index', 'show']);

        // Menu Items
        Route::get('menu-items', fn () => redirect()->route('admin.site-settings.edit'))->name('menu-items.index');
        Route::resource('menu-items', MenuItemController::class)->except(['index', 'show']);

        // Pages
        Route::resource('pages', PageController::class);

        // Service Times
        Route::get('service-times', fn () => redirect()->route('admin.site-settings.edit'))->name('service-times.index');
        Route::resource('service-times', ServiceTimeController::class)->except(['index', 'show']);

        // Volunteer Roles
        Route::get('volunteer-roles', fn () => redirect()->route('admin.site-settings.edit'))->name('volunteer-roles.index');
        Route::resource('volunteer-roles', VolunteerRoleController::class)->except(['index', 'show']);

        // Admin-only exports
        Route::get('exports/users', [ExportController::class, 'users'])->name('exports.users');
        Route::get('exports/counseling-cases', [ExportController::class, 'counselingCases'])->name('exports.counseling-cases');
    });

    // ── Staff+ routes (admin and staff only) ───────────────────────────
    Route::middleware('role:admin,staff')->group(function () {
        // Sermons
        Route::resource('sermons', SermonController::class)->except(['index', 'show']);

        // Speakers
        Route::resource('speakers', SpeakerController::class)->except(['index', 'show']);

        // Sermon Series
        Route::resource('series', SermonSeriesController::class)
            ->parameters(['series' => 'series'])
            ->except(['index', 'show']);

        // Posts
        Route::resource('posts', PostController::class)->except(['index', 'show']);

        // Highlights
        Route::resource('highlights', HighlightController::class)->except(['index', 'show']);

        // Documents
        Route::resource('documents', DocumentController::class)->except(['index', 'show']);

        // Reading Plans (write operations)
        Route::resource('reading-plans', ReadingPlanController::class)
            ->parameters(['reading-plans' => 'readingPlan'])
            ->except(['index', 'show']);
        Route::post('reading-plans/{readingPlan}/days', [ReadingPlanController::class, 'storeDay'])->name('reading-plans.days.store');
        Route::put('reading-plans/{readingPlan}/days/{day}', [ReadingPlanController::class, 'updateDay'])->name('reading-plans.days.update');
        Route::delete('reading-plans/{readingPlan}/days/{day}', [ReadingPlanController::class, 'destroyDay'])->name('reading-plans.days.destroy');

        // Courses (write operations)
        Route::resource('courses', CourseController::class)->except(['index', 'show']);
        Route::post('courses/{course}/modules', [CourseController::class, 'storeModule'])->name('courses.modules.store');
        Route::put('courses/{course}/modules/{module}', [CourseController::class, 'updateModule'])->name('courses.modules.update');
        Route::delete('courses/{course}/modules/{module}', [CourseController::class, 'destroyModule'])->name('courses.modules.destroy');
        Route::post('courses/{course}/modules/{module}/lessons', [CourseController::class, 'storeLesson'])->name('courses.lessons.store');
        Route::put('courses/{course}/modules/{module}/lessons/{lesson}', [CourseController::class, 'updateLesson'])->name('courses.lessons.update');
        Route::delete('courses/{course}/modules/{module}/lessons/{lesson}', [CourseController::class, 'destroyLesson'])->name('courses.lessons.destroy');

        // Books (write operations)
        Route::resource('books', BookController::class)->except(['index', 'show']);
        Route::get('books-lendings', [BookController::class, 'lendings'])->name('books.lendings');
        Route::post('books/{book}/lend', [BookController::class, 'lend'])->name('books.lend');
        Route::patch('lendings/{lending}/return', [BookController::class, 'returnBook'])->name('lendings.return');

        // Forms (write operations)
        Route::resource('forms', FormController::class)->except(['index', 'show']);

        // Counseling Cases (full CRUD — visibility scoping in controller)
        Route::get('counseling-cases/create', [CounselingCaseController::class, 'create'])->name('counseling-cases.create');
        Route::post('counseling-cases', [CounselingCaseController::class, 'store'])->name('counseling-cases.store');
        Route::get('counseling-cases/{counselingCase}/edit', [CounselingCaseController::class, 'edit'])->name('counseling-cases.edit');
        Route::put('counseling-cases/{counselingCase}', [CounselingCaseController::class, 'update'])->name('counseling-cases.update');
        Route::delete('counseling-cases/{counselingCase}', [CounselingCaseController::class, 'destroy'])->name('counseling-cases.destroy');
        Route::post('counseling-cases/{counselingCase}/sessions', [CounselingCaseController::class, 'addSession'])->name('counseling-cases.sessions');
        Route::post('counseling-cases/{counselingCase}/goals', [CounselingCaseController::class, 'addGoal'])->name('counseling-cases.goals.store');
        Route::put('counseling-cases/{counselingCase}/goals/{goal}', [CounselingCaseController::class, 'updateGoal'])->name('counseling-cases.goals.update');
        Route::post('counseling-cases/{counselingCase}/referrals', [CounselingCaseController::class, 'addReferral'])->name('counseling-cases.referrals');
        Route::post('counseling-cases/{counselingCase}/attachments', [CounselingCaseController::class, 'addAttachments'])->name('counseling-cases.attachments');

        // Benevolence: decide, disburse, destroy (admin+staff only)
        Route::post('benevolent-requests/{benevolentRequest}/decide', [BenevolentRequestController::class, 'decide'])->name('benevolent-requests.decide');
        Route::post('benevolent-requests/{benevolentRequest}/disburse', [BenevolentRequestController::class, 'disburse'])->name('benevolent-requests.disburse');
        Route::delete('benevolent-requests/{benevolentRequest}', [BenevolentRequestController::class, 'destroy'])->name('benevolent-requests.destroy');

        // Members (write operations)
        Route::get('members/create', [MemberController::class, 'create'])->name('members.create');
        Route::post('members', [MemberController::class, 'store'])->name('members.store');
        Route::get('members/{member}/edit', [MemberController::class, 'edit'])->name('members.edit');
        Route::put('members/{member}', [MemberController::class, 'update'])->name('members.update');
        Route::delete('members/{member}', [MemberController::class, 'destroy'])->name('members.destroy');
        Route::patch('members/{member}/status', [MemberController::class, 'changeStatus'])->name('members.status');
        Route::post('members/{member}/invite', [MemberController::class, 'invite'])->name('members.invite');
        Route::patch('members/{memberId}/restore', [MemberController::class, 'restore'])->name('members.restore');

        // Households
        Route::resource('households', HouseholdController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
        Route::post('households/{household}/members', [HouseholdController::class, 'addMember'])->name('households.members.store');
        Route::delete('households/{household}/members/{member}', [HouseholdController::class, 'removeMember'])->name('households.members.destroy');

        // Media Library
        Route::get('media-library', [MediaLibraryController::class, 'index'])->name('media-library.index');

        // Staff+ exports
        Route::prefix('exports')->name('exports.')->group(function () {
            Route::get('events/{event}/registrations', [ExportController::class, 'eventRegistrations'])->name('event-registrations');
            Route::get('forms/{form}/responses', [ExportController::class, 'formResponses'])->name('form-responses');
            Route::get('visitors', [ExportController::class, 'visitors'])->name('visitors');
            Route::get('members', [ExportController::class, 'members'])->name('members');
            Route::get('attendance/{attendanceSession}', [ExportController::class, 'attendanceSession'])->name('attendance');
            Route::get('book-lendings', [ExportController::class, 'bookLendings'])->name('book-lendings');
            Route::get('benevolent-requests', [ExportController::class, 'benevolentRequests'])->name('benevolent-requests');
        });
    });

    // ── Leader+ routes (admin, staff, and leader) ──────────────────────
    // Admin area home
    Route::get('/', DashboardController::class)->name('dashboard');

    // View-only access for content features (index + show)
    Route::get('sermons', [SermonController::class, 'index'])->name('sermons.index');
    Route::get('sermons/{sermon}', [SermonController::class, 'show'])->name('sermons.show');
    Route::get('speakers', [SpeakerController::class, 'index'])->name('speakers.index');
    Route::get('speakers/{speaker}', [SpeakerController::class, 'show'])->name('speakers.show');
    Route::get('series', [SermonSeriesController::class, 'index'])->name('series.index');
    Route::get('series/{series}', [SermonSeriesController::class, 'show'])->name('series.show');
    Route::get('posts', [PostController::class, 'index'])->name('posts.index');
    Route::get('posts/{post}', [PostController::class, 'show'])->name('posts.show');
    Route::get('highlights', [HighlightController::class, 'index'])->name('highlights.index');
    Route::get('highlights/{highlight}', [HighlightController::class, 'show'])->name('highlights.show');
    Route::get('documents', [DocumentController::class, 'index'])->name('documents.index');
    Route::get('documents/{document}', [DocumentController::class, 'show'])->name('documents.show');
    Route::get('reading-plans', [ReadingPlanController::class, 'index'])->name('reading-plans.index');
    Route::get('reading-plans/{readingPlan}', [ReadingPlanController::class, 'show'])->name('reading-plans.show');
    Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
    Route::get('courses/{course}', [CourseController::class, 'show'])->name('courses.show');
    Route::get('books', [BookController::class, 'index'])->name('books.index');
    Route::get('books/{book}', [BookController::class, 'show'])->name('books.show');
    Route::get('forms', [FormController::class, 'index'])->name('forms.index');
    Route::get('forms/{form}', [FormController::class, 'show'])->name('forms.show');
    Route::get('forms/{form}/responses', [FormController::class, 'responses'])->name('forms.responses');

    // Events (leaders can create + edit/delete own — scoped in controller)
    Route::resource('events', EventController::class);
    Route::get('events/{event}/registrations', [EventController::class, 'registrations'])->name('events.registrations');

    // Ministries (leaders see assigned only — scoped in controller)
    Route::resource('ministries', MinistryController::class);
    Route::get('ministries/{ministry}/members', [MinistryController::class, 'members'])->name('ministries.members');

    // Ministry Groups (leaders see assigned only — scoped in controller)
    Route::resource('ministry-groups', MinistryGroupController::class);
    Route::get('ministry-groups/{ministryGroup}/members', [MinistryGroupController::class, 'members'])->name('ministry-groups.members');

    // Volunteer Roster (leaders view only — mutations blocked in controller)
    Route::get('volunteer/roster', [VolunteerScheduleController::class, 'index'])->name('volunteer.roster');
    Route::post('volunteer/schedule', [VolunteerScheduleController::class, 'store'])->name('volunteer.schedule.store');
    Route::post('volunteer/schedule/bulk', [VolunteerScheduleController::class, 'bulkStore'])->name('volunteer.schedule.bulk');
    Route::put('volunteer/schedule/{volunteerSchedule}', [VolunteerScheduleController::class, 'update'])->name('volunteer.schedule.update');
    Route::delete('volunteer/schedule/{volunteerSchedule}', [VolunteerScheduleController::class, 'destroy'])->name('volunteer.schedule.destroy');

    // Care Needs (leaders see needs assigned to them or for their people — scoped in model)
    Route::resource('care-needs', CareNeedController::class)->parameters(['care-needs' => 'careNeed']);
    Route::post('care-needs/{careNeed}/updates', [CareNeedController::class, 'addUpdate'])->name('care-needs.updates.store');
    Route::post('care-needs/{careNeed}/escalate', [CareNeedController::class, 'escalate'])->name('care-needs.escalate');
    Route::post('care-needs/{careNeed}/tasks', [CareNeedController::class, 'storeTask'])->name('care-needs.tasks.store');
    Route::patch('care-needs/{careNeed}/tasks/{task}/volunteer', [CareNeedController::class, 'assignTask'])->name('care-needs.tasks.assign');
    Route::patch('care-needs/{careNeed}/tasks/{task}/complete', [CareNeedController::class, 'toggleTask'])->name('care-needs.tasks.complete');
    Route::delete('care-needs/{careNeed}/tasks/{task}', [CareNeedController::class, 'destroyTask'])->name('care-needs.tasks.destroy');

    // Attendance (leaders manage sessions for groups they lead — scoped in model)
    Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
    Route::post('attendance', [AttendanceController::class, 'store'])->name('attendance.store');
    Route::put('attendance/settings', [AttendanceController::class, 'updateSettings'])->name('attendance.settings');
    Route::get('attendance/{attendanceSession}', [AttendanceController::class, 'show'])->name('attendance.show');
    Route::put('attendance/{attendanceSession}', [AttendanceController::class, 'update'])->name('attendance.update');
    Route::delete('attendance/{attendanceSession}', [AttendanceController::class, 'destroy'])->name('attendance.destroy');
    Route::post('attendance/{attendanceSession}/check-in', [AttendanceController::class, 'checkIn'])->name('attendance.check-in');
    Route::delete('attendance/{attendanceSession}/check-in/{member}', [AttendanceController::class, 'removeCheckIn'])->name('attendance.check-out');
    Route::get('analytics/service-attendance', [AnalyticsController::class, 'serviceAttendance'])->name('analytics.service-attendance');

    // Members (leaders see members of ministries/groups they lead — scoped in model)
    Route::get('members', [MemberController::class, 'index'])->name('members.index');
    Route::get('members/{member}', [MemberController::class, 'show'])->name('members.show');

    // Visitors (leaders view + add follow-ups — scoped in controller)
    Route::get('visitors', [VisitorController::class, 'index'])->name('visitors.index');
    Route::get('visitors/{visitor}', [VisitorController::class, 'show'])->name('visitors.show');
    Route::patch('visitors/{visitor}', [VisitorController::class, 'update'])->name('visitors.update');
    Route::delete('visitors/{visitor}', [VisitorController::class, 'destroy'])->name('visitors.destroy');
    Route::post('visitors/{visitor}/follow-up', [VisitorController::class, 'addFollowUp'])->name('visitors.follow-up');
    Route::post('visitors/{visitor}/convert', [VisitorController::class, 'convert'])->name('visitors.convert');

    // Benevolence (index, show, create, store, review, attachments — deacon access in controller)
    Route::get('benevolent-requests', [BenevolentRequestController::class, 'index'])->name('benevolent-requests.index');
    Route::get('benevolent-requests/create', [BenevolentRequestController::class, 'create'])->name('benevolent-requests.create');
    Route::post('benevolent-requests', [BenevolentRequestController::class, 'store'])->name('benevolent-requests.store');
    Route::get('benevolent-requests/{benevolentRequest}', [BenevolentRequestController::class, 'show'])->name('benevolent-requests.show');
    Route::post('benevolent-requests/{benevolentRequest}/review', [BenevolentRequestController::class, 'addReview'])->name('benevolent-requests.review');
    Route::post('benevolent-requests/{benevolentRequest}/attachments', [BenevolentRequestController::class, 'addAttachments'])->name('benevolent-requests.attachments');

    // Analytics (leaders see event + ministry only — scoped in controller)
    Route::get('analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
    Route::get('analytics/membership-growth', [AnalyticsController::class, 'membershipGrowth'])->name('analytics.membership-growth');
    Route::get('analytics/event-attendance', [AnalyticsController::class, 'eventAttendance'])->name('analytics.event-attendance');
    Route::get('analytics/ministry-distribution', [AnalyticsController::class, 'ministryDistribution'])->name('analytics.ministry-distribution');
    Route::get('analytics/course-metrics', [AnalyticsController::class, 'courseMetrics'])->name('analytics.course-metrics');
    Route::get('analytics/visitor-funnel', [AnalyticsController::class, 'visitorFunnel'])->name('analytics.visitor-funnel');
    Route::get('analytics/benevolence-overview', [AnalyticsController::class, 'benevolenceOverview'])->name('analytics.benevolence-overview');
});

// Counseling Cases — accessible to staff+, deacons, and assigned counselors (authorization in controller)
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('counseling-cases', [CounselingCaseController::class, 'index'])->name('counseling-cases.index');
    Route::get('counseling-cases/{counselingCase}', [CounselingCaseController::class, 'show'])->name('counseling-cases.show');
});
