<?php

use App\Enums\MembershipStatus;
use App\Models\BookLending;
use App\Models\CareNeed;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Member;
use App\Models\Ministry;
use App\Models\MinistryMember;
use App\Models\User;
use App\Models\Visitor;
use App\Models\VolunteerSchedule;
use App\Services\DashboardOverviewService;

function overview(): DashboardOverviewService
{
    return app(DashboardOverviewService::class);
}

it('counts members per status in enum order, including empty statuses', function () {
    Member::factory()->count(3)->create();
    Member::factory()->regular()->create();
    Member::factory()->inactive()->create();

    $membership = overview()->membership();

    expect($membership['statuses'])->toHaveCount(count(MembershipStatus::cases()))
        ->and(collect($membership['statuses'])->pluck('value', 'label')->all())->toMatchArray([
            'Visitor' => 0,
            'Regular Attender' => 1,
            'Member' => 3,
            'Inactive' => 1,
        ])
        ->and($membership['activeMembers'])->toBe(4);
});

it('lists visitors at each follow-up stage in pipeline order', function () {
    Visitor::factory()->count(2)->create();
    Visitor::factory()->contacted()->create();
    Visitor::factory()->closed()->create();

    expect(overview()->visitorPipeline())->toBe([
        ['label' => 'New', 'value' => 2],
        ['label' => 'Contacted', 'value' => 1],
        ['label' => 'Follow Up', 'value' => 0],
        ['label' => 'Connected', 'value' => 0],
        ['label' => 'Closed', 'value' => 1],
    ]);
});

it('returns the soonest upcoming duties and skips past ones', function () {
    VolunteerSchedule::factory()->create(['scheduled_date' => now()->subDay()->toDateString()]);
    $later = VolunteerSchedule::factory()->confirmed()->create(['scheduled_date' => now()->addDays(5)->toDateString()]);
    $sooner = VolunteerSchedule::factory()->create(['scheduled_date' => now()->addDay()->toDateString()]);

    $duties = overview()->upcomingDuties();

    expect($duties['total'])->toBe(2)
        ->and(collect($duties['rows'])->pluck('id')->all())->toBe([$sooner->id, $later->id])
        ->and($duties['rows'][1]['statusLabel'])->toBe('Confirmed');
});

it('limits upcoming duties but still reports the full total', function () {
    VolunteerSchedule::factory()->count(DashboardOverviewService::LIST_LIMIT + 2)->create();

    $duties = overview()->upcomingDuties();

    expect($duties['rows'])->toHaveCount(DashboardOverviewService::LIST_LIMIT)
        ->and($duties['total'])->toBe(DashboardOverviewService::LIST_LIMIT + 2);
});

it('counts registrations on upcoming events without cancellations', function () {
    Event::factory()->past()->create();
    $event = Event::factory()->upcoming()->create(['max_attendees' => 10]);
    EventRegistration::factory()->count(2)->create(['event_id' => $event->id, 'status' => 'registered']);
    EventRegistration::factory()->create(['event_id' => $event->id, 'status' => 'cancelled']);

    $events = overview()->upcomingEvents();

    expect($events['total'])->toBe(1)
        ->and($events['rows'][0])->toMatchArray([
            'id' => $event->id,
            'registrations' => 2,
            'capacity' => 10,
        ]);
});

it('ranks ministries by member count', function () {
    $small = Ministry::factory()->create(['name' => 'Small']);
    $large = Ministry::factory()->create(['name' => 'Large']);
    MinistryMember::factory()->create(['ministry_id' => $small->id]);
    MinistryMember::factory()->count(3)->create(['ministry_id' => $large->id]);

    $ministries = overview()->ministries();

    expect($ministries['rows'])->toBe([
        ['label' => 'Large', 'value' => 3],
        ['label' => 'Small', 'value' => 1],
    ])->and($ministries['totalMinistries'])->toBe(2);
});

it('only counts care needs the viewer can see in the attention list', function () {
    $leader = User::factory()->leader()->create();
    CareNeed::factory()->overdue()->create();
    CareNeed::factory()->overdue()->confidential()->create();

    $overdue = collect(overview()->attention($leader))->firstWhere('key', 'overdue_care_needs');
    $adminOverdue = collect(overview()->attention(User::factory()->admin()->create()))->firstWhere('key', 'overdue_care_needs');

    expect($overdue['value'])->toBeLessThan($adminOverdue['value']);
});

it('links overdue books only for staff and above', function () {
    BookLending::factory()->overdue()->create();

    $forLeader = collect(overview()->attention(User::factory()->leader()->create()))->firstWhere('key', 'overdue_lendings');
    $forStaff = collect(overview()->attention(User::factory()->staff()->create()))->firstWhere('key', 'overdue_lendings');

    expect($forLeader['value'])->toBe(1)
        ->and($forLeader['href'])->toBeNull()
        ->and($forStaff['href'])->toBe(route('admin.books.lendings'));
});
