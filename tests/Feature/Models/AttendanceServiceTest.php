<?php

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Member;
use App\Models\ServiceTime;
use App\Models\User;
use App\Services\AttendanceService;
use Database\Seeders\DemoSeeder;
use Illuminate\Support\Facades\Notification;

it('totals members, excused, and guests', function () {
    $session = AttendanceSession::factory()->create(['guest_count' => 7]);
    AttendanceRecord::factory()->count(3)->create(['attendance_session_id' => $session->id]);
    AttendanceRecord::factory()->excused()->create(['attendance_session_id' => $session->id]);

    expect(app(AttendanceService::class)->totals($session))->toBe([
        'present' => 3,
        'excused' => 1,
        'guests' => 7,
        'total' => 10,
    ]);
});

it('combines services held on the same date in the trend', function () {
    $date = now()->subWeek()->toDateString();
    $early = AttendanceSession::factory()->on($date)->create(['guest_count' => 2]);
    $late = AttendanceSession::factory()->on($date)->create(['guest_count' => 3]);
    AttendanceRecord::factory()->create(['attendance_session_id' => $early->id]);
    AttendanceRecord::factory()->count(2)->create(['attendance_session_id' => $late->id]);

    $trend = app(AttendanceService::class)->serviceTrend(now()->subMonth()->toDateString(), now()->toDateString());

    expect($trend)->toHaveCount(1)
        ->and($trend->first())->toBe(['date' => $date, 'members' => 3, 'guests' => 5, 'total' => 8]);
});

it('summarises a member attendance rate', function () {
    $serviceTime = ServiceTime::factory()->create();
    $member = Member::factory()->create();
    foreach ([1, 2, 3, 4] as $weeksAgo) {
        $session = AttendanceSession::factory()->forService($serviceTime)->on(now()->subWeeks($weeksAgo)->toDateString())->create();
        if ($weeksAgo <= 3) {
            AttendanceRecord::factory()->create(['attendance_session_id' => $session->id, 'member_id' => $member->id]);
        }
    }

    $summary = app(AttendanceService::class)->memberSummary($member);

    expect($summary['services_held'])->toBe(4)
        ->and($summary['services_attended'])->toBe(3)
        ->and($summary['rate'])->toBe(75)
        ->and($summary['recent'])->toHaveCount(3);
});

it('shows the attendance summary on the member profile', function () {
    $member = Member::factory()->create();

    $this->actingAs(User::factory()->staff()->create())
        ->get(route('admin.members.show', $member))
        ->assertInertia(fn ($page) => $page
            ->where('attendance.services_held', 0)
            ->where('attendance.rate', null)
        );
});

it('serves service attendance analytics to staff only', function () {
    AttendanceRecord::factory()->create();

    $this->actingAs(User::factory()->staff()->create())
        ->getJson(route('admin.analytics.service-attendance'))
        ->assertSuccessful()
        ->assertJsonPath('data.0.members', 1);

    $this->actingAs(User::factory()->leader()->create())
        ->getJson(route('admin.analytics.service-attendance'))
        ->assertForbidden();
});

it('lists flagged absentees until they attend again', function () {
    $member = Member::factory()->create(['absence_alerted_at' => now()->subDay()]);
    $service = app(AttendanceService::class);

    expect($service->flaggedAbsentees()->modelKeys())->toBe([$member->id]);

    AttendanceRecord::factory()->create(['member_id' => $member->id]);

    expect($service->flaggedAbsentees())->toBeEmpty();
});

it('seeds demo attendance that flags the lapsed member', function () {
    Notification::fake();
    $this->seed(DemoSeeder::class);

    expect(AttendanceSession::count())->toBe(12)
        ->and(app(AttendanceService::class)->findNewlyAbsentMembers()->map->full_name->all())->toBe(['Lauren Harris']);
});
