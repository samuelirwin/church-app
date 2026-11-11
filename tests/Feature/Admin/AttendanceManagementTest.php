<?php

use App\Enums\AttendanceStatus;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\GroupMember;
use App\Models\Household;
use App\Models\Member;
use App\Models\MinistryGroup;
use App\Models\ServiceTime;
use App\Models\SiteSetting;
use App\Models\User;

describe('access', function () {
    it('denies members access to attendance', function () {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.attendance.index'))
            ->assertForbidden();
    });

    it('shows staff every session', function () {
        AttendanceSession::factory()->count(2)->create();
        AttendanceSession::factory()->forGroup(MinistryGroup::factory()->create())->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.attendance.index'))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('admin/attendance/index')
                ->has('sessions.data', 3)
                ->has('sources', 3)
                ->where('canManageSettings', true)
            );
    });

    it('only shows leaders sessions for groups they lead', function () {
        $leader = User::factory()->leader()->create();
        $ownGroup = MinistryGroup::factory()->create(['leader_id' => $leader->id]);
        AttendanceSession::factory()->forGroup($ownGroup)->create();
        AttendanceSession::factory()->forGroup(MinistryGroup::factory()->create())->create();
        $service = AttendanceSession::factory()->create();

        $this->actingAs($leader)
            ->get(route('admin.attendance.index'))
            ->assertInertia(fn ($page) => $page
                ->has('sessions.data', 1)
                ->has('sources', 1)
                ->where('canManageSettings', false)
            );

        $this->actingAs($leader)->get(route('admin.attendance.show', $service))->assertForbidden();
    });
});

describe('opening sessions', function () {
    it('opens a service session and redirects to roll call', function () {
        $serviceTime = ServiceTime::factory()->create();

        $response = $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.attendance.store'), [
                'source' => 'service',
                'attendable_id' => $serviceTime->id,
                'occurred_on' => now()->toDateString(),
            ]);

        $session = AttendanceSession::firstOrFail();
        $response->assertRedirect(route('admin.attendance.show', $session));
        expect($session->attendable->is($serviceTime))->toBeTrue()
            ->and($session->check_in_token)->toHaveLength(40);
    });

    it('reuses the existing session for the same service and date', function () {
        $staff = User::factory()->staff()->create();
        $serviceTime = ServiceTime::factory()->create();
        $payload = ['source' => 'service', 'attendable_id' => $serviceTime->id, 'occurred_on' => '2026-11-08'];

        $this->actingAs($staff)->post(route('admin.attendance.store'), $payload);
        $this->actingAs($staff)->post(route('admin.attendance.store'), $payload);

        expect(AttendanceSession::count())->toBe(1);
    });

    it('validates the session form', function (array $payload, string $field) {
        $serviceTime = ServiceTime::factory()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.attendance.store'), array_merge([
                'source' => 'service',
                'attendable_id' => $serviceTime->id,
                'occurred_on' => now()->toDateString(),
            ], $payload))
            ->assertSessionHasErrors($field);
    })->with([
        'missing source' => [['source' => ''], 'source'],
        'unknown source' => [['source' => 'party'], 'source'],
        'missing item' => [['attendable_id' => ''], 'attendable_id'],
        'item does not exist' => [['attendable_id' => 9999], 'attendable_id'],
        'missing date' => [['occurred_on' => ''], 'occurred_on'],
        'too far ahead' => [['occurred_on' => now()->addDays(30)->toDateString()], 'occurred_on'],
    ]);

    it('lets a leader open a session for their own group only', function () {
        $leader = User::factory()->leader()->create();
        $ownGroup = MinistryGroup::factory()->create(['leader_id' => $leader->id]);
        $otherGroup = MinistryGroup::factory()->create();
        $serviceTime = ServiceTime::factory()->create();
        $date = now()->toDateString();

        $this->actingAs($leader)
            ->post(route('admin.attendance.store'), ['source' => 'group', 'attendable_id' => $ownGroup->id, 'occurred_on' => $date])
            ->assertRedirect();
        $this->actingAs($leader)
            ->post(route('admin.attendance.store'), ['source' => 'group', 'attendable_id' => $otherGroup->id, 'occurred_on' => $date])
            ->assertForbidden();
        $this->actingAs($leader)
            ->post(route('admin.attendance.store'), ['source' => 'service', 'attendable_id' => $serviceTime->id, 'occurred_on' => $date])
            ->assertForbidden();
    });
});

describe('roll call', function () {
    it('lists all active members for a service', function () {
        Member::factory()->count(2)->create();
        Member::factory()->inactive()->create();
        $session = AttendanceSession::factory()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.attendance.show', $session))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('admin/attendance/show')
                ->has('roster', 2)
                ->where('totals.total', 0)
                ->where('session.self_check_in_open', true)
            );
    });

    it('lists only group members for a group session, plus anyone already checked in', function () {
        $group = MinistryGroup::factory()->create();
        $inGroup = Member::factory()->withUser()->create();
        GroupMember::factory()->create(['ministry_group_id' => $group->id, 'user_id' => $inGroup->user_id]);
        $visitor = Member::factory()->create();
        Member::factory()->create();

        $session = AttendanceSession::factory()->forGroup($group)->create();
        AttendanceRecord::factory()->create(['attendance_session_id' => $session->id, 'member_id' => $visitor->id]);

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.attendance.show', $session))
            ->assertInertia(fn ($page) => $page->has('roster', 2));
    });

    it('checks in members, including a whole household', function () {
        $staff = User::factory()->staff()->create();
        $household = Household::factory()->create();
        $parent = Member::factory()->inHousehold($household)->create();
        $child = Member::factory()->child()->inHousehold($household)->create();
        $session = AttendanceSession::factory()->create();

        $this->actingAs($staff)
            ->post(route('admin.attendance.check-in', $session), ['member_ids' => [$parent->id, $child->id]])
            ->assertRedirect();

        expect($session->records()->count())->toBe(2)
            ->and($session->records()->first()->checked_in_by)->toBe($staff->id);
    });

    it('does not duplicate a check-in and can switch to excused', function () {
        $staff = User::factory()->staff()->create();
        $member = Member::factory()->create();
        $session = AttendanceSession::factory()->create();

        $this->actingAs($staff)->post(route('admin.attendance.check-in', $session), ['member_ids' => [$member->id]]);
        $this->actingAs($staff)->post(route('admin.attendance.check-in', $session), ['member_ids' => [$member->id]]);
        expect($session->records()->count())->toBe(1);

        $this->actingAs($staff)->post(route('admin.attendance.check-in', $session), ['member_ids' => [$member->id], 'status' => 'excused']);
        expect($session->records()->first()->status)->toBe(AttendanceStatus::Excused);
    });

    it('validates check-in input', function (array $payload) {
        $session = AttendanceSession::factory()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.attendance.check-in', $session), $payload)
            ->assertSessionHasErrors();
    })->with([
        'no members' => [['member_ids' => []]],
        'unknown member' => [['member_ids' => [9999]]],
        'bad status' => [['member_ids' => [1], 'status' => 'asleep']],
    ]);

    it('removes a check-in', function () {
        $record = AttendanceRecord::factory()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->delete(route('admin.attendance.check-out', [$record->attendance_session_id, $record->member_id]))
            ->assertRedirect();

        expect(AttendanceRecord::count())->toBe(0);
    });

    it('stops a leader from checking people in to another group', function () {
        $leader = User::factory()->leader()->create();
        $session = AttendanceSession::factory()->forGroup(MinistryGroup::factory()->create())->create();

        $this->actingAs($leader)
            ->post(route('admin.attendance.check-in', $session), ['member_ids' => [Member::factory()->create()->id]])
            ->assertForbidden();
    });

    it('updates the guest count and validates it', function () {
        $staff = User::factory()->staff()->create();
        $session = AttendanceSession::factory()->create();

        $this->actingAs($staff)
            ->put(route('admin.attendance.update', $session), ['guest_count' => 12, 'notes' => 'Rainy day'])
            ->assertSessionHasNoErrors();
        expect($session->fresh())->guest_count->toBe(12)->notes->toBe('Rainy day');

        $this->actingAs($staff)
            ->put(route('admin.attendance.update', $session), ['guest_count' => -1])
            ->assertSessionHasErrors('guest_count');
    });

    it('only lets staff delete a session', function () {
        $leader = User::factory()->leader()->create();
        $session = AttendanceSession::factory()->forGroup(MinistryGroup::factory()->create(['leader_id' => $leader->id]))->create();

        $this->actingAs($leader)->delete(route('admin.attendance.destroy', $session))->assertForbidden();
        $this->actingAs(User::factory()->staff()->create())->delete(route('admin.attendance.destroy', $session))->assertRedirect();

        expect(AttendanceSession::count())->toBe(0);
    });

    it('exports a session as csv', function () {
        $record = AttendanceRecord::factory()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.exports.attendance', $record->attendance_session_id))
            ->assertSuccessful();
    });
});

describe('settings', function () {
    it('saves the absence threshold', function () {
        $this->actingAs(User::factory()->staff()->create())
            ->put(route('admin.attendance.settings'), ['absence_threshold' => 4])
            ->assertSessionHasNoErrors();

        expect(SiteSetting::getValue('attendance', 'absence_threshold'))->toBe('4');
    });

    it('validates the absence threshold', function (mixed $value) {
        $this->actingAs(User::factory()->staff()->create())
            ->put(route('admin.attendance.settings'), ['absence_threshold' => $value])
            ->assertSessionHasErrors('absence_threshold');
    })->with([0, 13, 'abc', '']);

    it('blocks leaders from changing settings', function () {
        $this->actingAs(User::factory()->leader()->create())
            ->put(route('admin.attendance.settings'), ['absence_threshold' => 4])
            ->assertForbidden();
    });
});

describe('sessions table', function () {
    it('filters by several types and sorts by checked-in count', function () {
        $staff = User::factory()->staff()->create();
        $busy = AttendanceSession::factory()->on('2026-11-01')->create();
        AttendanceRecord::factory()->count(3)->create(['attendance_session_id' => $busy->id]);
        $quiet = AttendanceSession::factory()->on('2026-11-08')->create();
        AttendanceRecord::factory()->create(['attendance_session_id' => $quiet->id]);
        AttendanceSession::factory()->forGroup(MinistryGroup::factory()->create())->create();

        $this->actingAs($staff)
            ->get(route('admin.attendance.index', ['source' => ['service'], 'sort' => 'present', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page
                ->has('sessions.data', 2)
                ->where('sessions.data.0.id', $busy->id)
                ->where('filters.source', ['service'])
                ->where('filters.sort', 'present'));

        $this->actingAs($staff)
            ->get(route('admin.attendance.index', ['source' => ['service', 'group']]))
            ->assertInertia(fn ($page) => $page->has('sessions.data', 3));
    });

    it('defaults to newest first and ignores unknown sorts or types', function () {
        $older = AttendanceSession::factory()->on('2026-10-01')->create();
        $newer = AttendanceSession::factory()->on('2026-11-01')->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.attendance.index', ['sort' => 'title; drop', 'source' => ['nonsense']]))
            ->assertInertia(fn ($page) => $page
                ->where('sessions.data.0.id', $newer->id)
                ->where('sessions.data.1.id', $older->id)
                ->where('filters.sort', null)
                ->where('filters.source', []));
    });
});
