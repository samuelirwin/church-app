<?php

use App\Models\ServiceTime;
use App\Models\User;
use App\Models\VolunteerRole;
use App\Models\VolunteerSchedule;

it('denies member access to volunteer roster', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.volunteer.roster'))
        ->assertForbidden();
});

it('allows staff to view volunteer roster', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.volunteer.roster'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/volunteer/roster')
            ->has('schedules')
            ->has('roles')
            ->has('users')
            ->has('serviceTimes')
            ->has('weekStart')
            ->has('nextSundaySchedules')
            ->has('nextSundayDate')
        );
});

it('returns next sunday schedules and date in roster', function () {
    $staff = User::factory()->staff()->create();
    $role = VolunteerRole::factory()->create();
    $serviceTime = ServiceTime::factory()->create();

    $nextSunday = now()->isSunday() ? now() : now()->next(\Carbon\Carbon::SUNDAY);

    $sundaySchedule = VolunteerSchedule::factory()->create([
        'volunteer_role_id' => $role->id,
        'scheduled_date' => $nextSunday->toDateString(),
        'service_time_id' => $serviceTime->id,
    ]);

    $mondaySchedule = VolunteerSchedule::factory()->create([
        'volunteer_role_id' => $role->id,
        'scheduled_date' => $nextSunday->copy()->addDay()->toDateString(),
        'service_time_id' => $serviceTime->id,
    ]);

    $this->actingAs($staff)
        ->get(route('admin.volunteer.roster'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('nextSundayDate', $nextSunday->toDateString())
            ->has('nextSundaySchedules', 1)
            ->where('nextSundaySchedules.0.id', $sundaySchedule->id)
        );
});

it('creates a volunteer schedule', function () {
    $staff = User::factory()->staff()->create();
    $role = VolunteerRole::factory()->create();
    $volunteer = User::factory()->create();
    $serviceTime = ServiceTime::factory()->create();

    $this->actingAs($staff)
        ->post(route('admin.volunteer.schedule.store'), [
            'volunteer_role_id' => $role->id,
            'user_id' => $volunteer->id,
            'scheduled_date' => now()->addDays(7)->format('Y-m-d'),
            'service_time_id' => $serviceTime->id,
        ])
        ->assertRedirect();

    expect(VolunteerSchedule::where('user_id', $volunteer->id)->exists())->toBeTrue();
});

it('validates required fields when creating a schedule', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.volunteer.schedule.store'), [])
        ->assertSessionHasErrors(['volunteer_role_id', 'user_id', 'scheduled_date', 'service_time_id']);
});

it('creates bulk schedules', function () {
    $staff = User::factory()->staff()->create();
    $role = VolunteerRole::factory()->create();
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $serviceTime = ServiceTime::factory()->create();

    $this->actingAs($staff)
        ->post(route('admin.volunteer.schedule.bulk'), [
            'assignments' => [
                [
                    'volunteer_role_id' => $role->id,
                    'user_id' => $user1->id,
                    'scheduled_date' => now()->addDays(7)->format('Y-m-d'),
                    'service_time_id' => $serviceTime->id,
                ],
                [
                    'volunteer_role_id' => $role->id,
                    'user_id' => $user2->id,
                    'scheduled_date' => now()->addDays(7)->format('Y-m-d'),
                    'service_time_id' => $serviceTime->id,
                ],
            ],
        ])
        ->assertRedirect();

    expect(VolunteerSchedule::count())->toBe(2);
});

it('skips duplicate assignments in bulk', function () {
    $staff = User::factory()->staff()->create();
    $role = VolunteerRole::factory()->create();
    $volunteer = User::factory()->create();
    $serviceTime = ServiceTime::factory()->create();
    $date = now()->addDays(7)->format('Y-m-d');

    VolunteerSchedule::factory()->create([
        'volunteer_role_id' => $role->id,
        'user_id' => $volunteer->id,
        'scheduled_date' => $date,
        'service_time_id' => $serviceTime->id,
    ]);

    $this->actingAs($staff)
        ->post(route('admin.volunteer.schedule.bulk'), [
            'assignments' => [
                [
                    'volunteer_role_id' => $role->id,
                    'user_id' => $volunteer->id,
                    'scheduled_date' => $date,
                    'service_time_id' => $serviceTime->id,
                ],
            ],
        ])
        ->assertRedirect();

    expect(VolunteerSchedule::where('user_id', $volunteer->id)->count())->toBe(1);
});

it('updates a volunteer schedule status', function () {
    $staff = User::factory()->staff()->create();
    $schedule = VolunteerSchedule::factory()->create();

    $this->actingAs($staff)
        ->put(route('admin.volunteer.schedule.update', $schedule), [
            'status' => 'confirmed',
        ])
        ->assertRedirect();

    expect($schedule->fresh()->status->value)->toBe('confirmed');
});

it('deletes a volunteer schedule', function () {
    $staff = User::factory()->staff()->create();
    $schedule = VolunteerSchedule::factory()->create();

    $this->actingAs($staff)
        ->delete(route('admin.volunteer.schedule.destroy', $schedule))
        ->assertRedirect();

    expect(VolunteerSchedule::find($schedule->id))->toBeNull();
});

it('filters roster by week', function () {
    $staff = User::factory()->staff()->create();
    $weekStart = now()->startOfWeek()->format('Y-m-d');

    $this->actingAs($staff)
        ->get(route('admin.volunteer.roster', ['week' => $weekStart]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('weekStart', $weekStart)
        );
});

it('filters roster by role', function () {
    $staff = User::factory()->staff()->create();
    $role = VolunteerRole::factory()->create();
    VolunteerSchedule::factory()->create([
        'volunteer_role_id' => $role->id,
        'scheduled_date' => now()->format('Y-m-d'),
    ]);
    VolunteerSchedule::factory()->create([
        'scheduled_date' => now()->format('Y-m-d'),
    ]);

    $this->actingAs($staff)
        ->get(route('admin.volunteer.roster', ['role_id' => $role->id]))
        ->assertSuccessful();
});
