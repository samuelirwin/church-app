<?php

use App\Models\Event;
use App\Models\Ministry;
use App\Models\MinistryMember;
use App\Models\User;
use App\Models\Visitor;

// ── Admin-only routes ──────────────────────────────────────────────

it('restricts user management to admin only', function () {
    $staff = User::factory()->staff()->create();
    $leader = User::factory()->leader()->create();

    $this->actingAs($staff)->get(route('admin.users.index'))->assertForbidden();
    $this->actingAs($leader)->get(route('admin.users.index'))->assertForbidden();
});

it('allows admin to access user management', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->get(route('admin.users.index'))->assertOk();
});

it('restricts site settings to admin only', function () {
    $staff = User::factory()->staff()->create();
    $leader = User::factory()->leader()->create();

    $this->actingAs($staff)->get(route('admin.site-settings.edit'))->assertForbidden();
    $this->actingAs($leader)->get(route('admin.site-settings.edit'))->assertForbidden();
});

it('restricts pages to admin only', function () {
    $staff = User::factory()->staff()->create();
    $leader = User::factory()->leader()->create();

    $this->actingAs($staff)->get(route('admin.pages.index'))->assertForbidden();
    $this->actingAs($leader)->get(route('admin.pages.index'))->assertForbidden();
});

it('restricts hero slides to admin only', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)->get(route('admin.hero-slides.create'))->assertForbidden();
});

it('restricts service times to admin only', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)->get(route('admin.service-times.create'))->assertForbidden();
});

it('restricts volunteer roles to admin only', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)->get(route('admin.volunteer-roles.create'))->assertForbidden();
});

it('restricts menu items to admin only', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)->get(route('admin.menu-items.create'))->assertForbidden();
});

it('restricts user export to admin only', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)->get(route('admin.exports.users'))->assertForbidden();
});

it('restricts counseling export to admin only', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)->get(route('admin.exports.counseling-cases'))->assertForbidden();
});

// ── Staff+ routes deny leaders ─────────────────────────────────────

it('denies leader from creating sermons', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)->get(route('admin.sermons.create'))->assertForbidden();
});

it('denies leader from creating posts', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)->get(route('admin.posts.create'))->assertForbidden();
});

it('denies leader from creating courses', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)->get(route('admin.courses.create'))->assertForbidden();
});

it('allows leader to view sermons index', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)->get(route('admin.sermons.index'))->assertOk();
});

it('allows leader to view posts index', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)->get(route('admin.posts.index'))->assertOk();
});

it('allows leader to view reading plans index', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)->get(route('admin.reading-plans.index'))->assertOk();
});

// ── Event scoping for leaders ──────────────────────────────────────

it('allows leaders to create events', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)->get(route('admin.events.create'))->assertOk();
});

it('denies leader from editing events they did not create', function () {
    $leader = User::factory()->leader()->create();
    $event = Event::factory()->create(['created_by' => User::factory()->admin()->create()->id]);

    $this->actingAs($leader)->get(route('admin.events.edit', $event))->assertForbidden();
});

it('allows leader to edit own events', function () {
    $leader = User::factory()->leader()->create();
    $event = Event::factory()->create(['created_by' => $leader->id]);

    $this->actingAs($leader)->get(route('admin.events.edit', $event))->assertOk();
});

// ── Ministry scoping for leaders ───────────────────────────────────

it('denies leader from creating ministries', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)->get(route('admin.ministries.create'))->assertForbidden();
});

it('denies leader from deleting ministries', function () {
    $leader = User::factory()->leader()->create();
    $ministry = Ministry::factory()->create(['leader_id' => $leader->id]);

    $this->actingAs($leader)->delete(route('admin.ministries.destroy', $ministry))->assertForbidden();
});

it('allows leader to edit own ministry', function () {
    $leader = User::factory()->leader()->create();
    $ministry = Ministry::factory()->create(['leader_id' => $leader->id]);

    $this->actingAs($leader)->get(route('admin.ministries.edit', $ministry))->assertOk();
});

// ── Volunteer schedule mutations restricted to staff+ ──────────────

it('denies leader from creating volunteer schedules', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)
        ->post(route('admin.volunteer.schedule.store'), [])
        ->assertForbidden();
});

it('allows leader to view volunteer roster', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)->get(route('admin.volunteer.roster'))->assertOk();
});

// ── Visitor controller authorization ───────────────────────────────

it('denies leader from updating visitors', function () {
    $leader = User::factory()->leader()->create();
    $visitor = Visitor::factory()->create();

    $this->actingAs($leader)
        ->patch(route('admin.visitors.update', $visitor), ['notes' => 'test'])
        ->assertForbidden();
});

it('denies leader from deleting visitors', function () {
    $leader = User::factory()->leader()->create();
    $visitor = Visitor::factory()->create();

    $this->actingAs($leader)
        ->delete(route('admin.visitors.destroy', $visitor))
        ->assertForbidden();
});

it('denies leader from converting visitors without deacon status', function () {
    $leader = User::factory()->leader()->create();
    $visitor = Visitor::factory()->create(['email' => 'test@example.com']);

    $this->actingAs($leader)
        ->post(route('admin.visitors.convert', $visitor))
        ->assertForbidden();
});

// ── Benevolence access control ─────────────────────────────────────

it('denies leader from viewing benevolent requests without deacon status', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)
        ->get(route('admin.benevolent-requests.index'))
        ->assertForbidden();
});

it('allows deacon to view benevolent requests', function () {
    $leader = User::factory()->leader()->create();
    $governanceMinistry = Ministry::factory()->create(['is_governance_body' => true]);
    MinistryMember::factory()->create(['user_id' => $leader->id, 'ministry_id' => $governanceMinistry->id]);

    $this->actingAs($leader)
        ->get(route('admin.benevolent-requests.index'))
        ->assertOk();
});

it('allows deacon to create benevolent requests', function () {
    $leader = User::factory()->leader()->create();
    $governanceMinistry = Ministry::factory()->create(['is_governance_body' => true]);
    MinistryMember::factory()->create(['user_id' => $leader->id, 'ministry_id' => $governanceMinistry->id]);

    $this->actingAs($leader)
        ->get(route('admin.benevolent-requests.create'))
        ->assertOk();
});

// ── Counseling access control ──────────────────────────────────────

it('denies leader from viewing counseling cases without deacon status', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)
        ->get(route('admin.counseling-cases.index'))
        ->assertForbidden();
});

it('allows deacon to view counseling cases index', function () {
    $leader = User::factory()->leader()->create();
    $governanceMinistry = Ministry::factory()->create(['is_governance_body' => true]);
    MinistryMember::factory()->create(['user_id' => $leader->id, 'ministry_id' => $governanceMinistry->id]);

    $this->actingAs($leader)
        ->get(route('admin.counseling-cases.index'))
        ->assertOk();
});

it('denies leader from creating counseling cases', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)
        ->get(route('admin.counseling-cases.create'))
        ->assertForbidden();
});

// ── Analytics scoping ──────────────────────────────────────────────

it('allows leader to view analytics index', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)->get(route('admin.analytics.index'))->assertOk();
});

it('allows leader to view event attendance analytics', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)->get(route('admin.analytics.event-attendance'))->assertOk();
});

it('denies leader from viewing membership growth analytics', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)
        ->get(route('admin.analytics.membership-growth'))
        ->assertForbidden();
});

it('denies leader from viewing visitor funnel analytics', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)
        ->get(route('admin.analytics.visitor-funnel'))
        ->assertForbidden();
});

// ── Deacon helper method ───────────────────────────────────────────

it('identifies deacon status via governance body membership', function () {
    $user = User::factory()->leader()->create();
    $regularMinistry = Ministry::factory()->create(['is_governance_body' => false]);
    $governanceMinistry = Ministry::factory()->create(['is_governance_body' => true]);

    MinistryMember::factory()->create(['user_id' => $user->id, 'ministry_id' => $regularMinistry->id]);
    expect($user->isDeacon())->toBeFalse();

    MinistryMember::factory()->create(['user_id' => $user->id, 'ministry_id' => $governanceMinistry->id]);
    expect($user->fresh()->isDeacon())->toBeTrue();
});

// ── Export access control ──────────────────────────────────────────

it('denies leader from accessing exports', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)
        ->get(route('admin.exports.visitors'))
        ->assertForbidden();
});

it('allows staff to access general exports', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.exports.visitors'))
        ->assertOk();
});

// ── Permissions shared via Inertia ─────────────────────────────────

it('shares permissions via Inertia for authenticated users', function () {
    $leader = User::factory()->leader()->create();

    $response = $this->actingAs($leader)->get(route('admin.sermons.index'));
    $response->assertOk();

    $page = $response->viewData('page');
    expect($page['props']['permissions'])->toHaveKeys([
        'isAdmin',
        'isStaffOrAbove',
        'isLeaderOrAbove',
        'isDeacon',
    ]);
    expect($page['props']['permissions']['isAdmin'])->toBeFalse();
    expect($page['props']['permissions']['isLeaderOrAbove'])->toBeTrue();
});

// ── Media library restricted to staff+ ─────────────────────────────

it('denies leader from accessing media library', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)
        ->get(route('admin.media-library.index'))
        ->assertForbidden();
});
