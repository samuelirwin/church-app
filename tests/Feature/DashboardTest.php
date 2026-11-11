<?php

use App\Models\BookLending;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Page;
use App\Models\ReadingPlan;
use App\Models\ReadingPlanEnrollment;
use App\Models\Sermon;
use App\Models\Speaker;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard includes member data for all authenticated users', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('memberData')
            ->has('memberData.courseEnrollments')
            ->has('memberData.readingPlanEnrollments')
            ->has('memberData.bookLendings')
            ->has('memberData.recentSermons')
            ->missing('adminData')
        );
});

test('admin dashboard shows the church-wide overview to leaders, staff, and admins', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->has('attention', 4)
            ->has('membership.statuses')
            ->has('visitorPipeline', 5)
            ->has('upcomingDuties.rows')
            ->has('upcomingEvents.rows')
            ->has('ministries.rows')
            ->has('contentLibrary', 6)
            ->has('engagement', 5)
            ->missing('stats')
        );
});

test('members cannot open the admin dashboard', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

test('dashboard shows active course enrollments for the user', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['title' => 'Active Course']);
    CourseEnrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 50,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('memberData.courseEnrollments', 1)
            ->where('memberData.courseEnrollments.0.course_title', 'Active Course')
            ->where('memberData.courseEnrollments.0.progress', 50)
        );
});

test('dashboard excludes completed course enrollments', function () {
    $user = User::factory()->create();
    CourseEnrollment::factory()->completed()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('memberData.courseEnrollments', 0)
        );
});

test('dashboard shows active reading plan enrollments', function () {
    $user = User::factory()->create();
    $plan = ReadingPlan::factory()->create(['title' => 'My Plan', 'duration_days' => 30]);
    ReadingPlanEnrollment::factory()->create([
        'user_id' => $user->id,
        'reading_plan_id' => $plan->id,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('memberData.readingPlanEnrollments', 1)
            ->where('memberData.readingPlanEnrollments.0.plan_title', 'My Plan')
            ->where('memberData.readingPlanEnrollments.0.total_days', 30)
        );
});

test('dashboard shows active book lendings with overdue flag', function () {
    $user = User::factory()->create();
    BookLending::factory()->overdue()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('memberData.bookLendings', 1)
            ->where('memberData.bookLendings.0.is_overdue', true)
        );
});

test('dashboard shows recent published sermons', function () {
    $speaker = Speaker::factory()->create();
    Sermon::factory()->published()->create([
        'title' => 'Recent Sermon',
        'speaker_id' => $speaker->id,
        'sermon_date' => now()->subDay(),
    ]);
    Sermon::factory()->draft()->create(['speaker_id' => $speaker->id]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('memberData.recentSermons', 1)
            ->where('memberData.recentSermons.0.title', 'Recent Sermon')
        );
});

test('admin overview includes correct counts', function () {
    $admin = User::factory()->admin()->create();
    Sermon::factory()->count(2)->create();
    Course::factory()->count(2)->create();
    BookLending::factory()->count(2)->create();
    BookLending::factory()->overdue()->create();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('membership.userAccounts', User::count())
            ->where('contentLibrary.0', ['label' => 'Sermons', 'value' => 2])
            ->where('contentLibrary.2', ['label' => 'Courses', 'value' => 2])
            ->where('engagement.4', ['label' => 'Books on loan', 'value' => 3])
            ->where('attention.3.value', 1)
        );
});

test('a cms page titled admin cannot take over the admin url', function () {
    $page = Page::factory()->create(['title' => 'Admin']);

    expect($page->slug)->toBe('admin-page');
});
