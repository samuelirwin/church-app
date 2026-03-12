<?php

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\User;
use App\Models\Visitor;

it('renders analytics page for admin', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.analytics.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('admin/analytics/index'));
});

it('renders analytics page for staff', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.analytics.index'))
        ->assertSuccessful();
});

it('forbids analytics page for regular members', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.analytics.index'))
        ->assertForbidden();
});

it('returns membership growth data', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->count(3)->create();

    $this->actingAs($admin)
        ->getJson(route('admin.analytics.membership-growth', [
            'start_date' => now()->subYear()->toDateString(),
            'end_date' => now()->toDateString(),
        ]))
        ->assertOk()
        ->assertJsonStructure(['data']);
});

it('returns event attendance data', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->published()->create([
        'starts_at' => now()->addDays(3),
    ]);
    EventRegistration::factory()->count(5)->create(['event_id' => $event->id]);

    $this->actingAs($admin)
        ->getJson(route('admin.analytics.event-attendance', [
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
        ]))
        ->assertOk()
        ->assertJsonStructure(['data' => [['title', 'date', 'registrations']]]);
});

it('returns ministry distribution data', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->getJson(route('admin.analytics.ministry-distribution'))
        ->assertOk()
        ->assertJsonStructure(['data']);
});

it('returns course metrics data', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->getJson(route('admin.analytics.course-metrics', [
            'start_date' => now()->subYear()->toDateString(),
            'end_date' => now()->toDateString(),
        ]))
        ->assertOk()
        ->assertJsonStructure(['data']);
});

it('returns visitor funnel data', function () {
    $admin = User::factory()->admin()->create();
    Visitor::factory()->count(5)->create();

    $this->actingAs($admin)
        ->getJson(route('admin.analytics.visitor-funnel', [
            'start_date' => now()->subYear()->toDateString(),
            'end_date' => now()->toDateString(),
        ]))
        ->assertOk()
        ->assertJsonStructure(['data' => [['stage', 'count']]]);
});

it('returns benevolence overview data', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->getJson(route('admin.analytics.benevolence-overview', [
            'start_date' => now()->subYear()->toDateString(),
            'end_date' => now()->toDateString(),
        ]))
        ->assertOk()
        ->assertJsonStructure(['data']);
});

it('returns empty data with valid structure when no records exist', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->getJson(route('admin.analytics.event-attendance', [
            'start_date' => now()->addYear()->toDateString(),
            'end_date' => now()->addYear()->addMonth()->toDateString(),
        ]))
        ->assertOk()
        ->assertJson(['data' => []]);
});

it('uses default date range when no dates provided', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->getJson(route('admin.analytics.membership-growth'))
        ->assertOk()
        ->assertJsonStructure(['data']);
});
