<?php

use App\Models\User;
use App\Models\VolunteerSchedule;

it('requires authentication to view duties', function () {
    $this->get(route('volunteer.my-duties'))
        ->assertRedirect(route('login'));
});

it('displays my upcoming duties', function () {
    $user = User::factory()->create();
    VolunteerSchedule::factory()->count(3)->create([
        'user_id' => $user->id,
        'scheduled_date' => now()->addDays(7)->format('Y-m-d'),
    ]);

    $this->actingAs($user)
        ->get(route('volunteer.my-duties'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('member/volunteer/my-duties')
            ->has('duties.data', 3)
        );
});

it('returns next sunday date in my duties', function () {
    $user = User::factory()->create();

    $nextSunday = now()->isSunday() ? now() : now()->next(\Carbon\Carbon::SUNDAY);

    $this->actingAs($user)
        ->get(route('volunteer.my-duties'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('nextSundayDate')
            ->where('nextSundayDate', $nextSunday->toDateString())
        );
});

it('only shows upcoming duties', function () {
    $user = User::factory()->create();
    VolunteerSchedule::factory()->create([
        'user_id' => $user->id,
        'scheduled_date' => now()->addDays(7)->format('Y-m-d'),
    ]);
    VolunteerSchedule::factory()->create([
        'user_id' => $user->id,
        'scheduled_date' => now()->subDays(7)->format('Y-m-d'),
    ]);

    $this->actingAs($user)
        ->get(route('volunteer.my-duties'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('duties.data', 1)
        );
});

it('allows user to confirm a duty', function () {
    $user = User::factory()->create();
    $schedule = VolunteerSchedule::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->post(route('volunteer.confirm', $schedule))
        ->assertRedirect();

    expect($schedule->fresh()->status->value)->toBe('confirmed');
});

it('allows user to decline a duty', function () {
    $user = User::factory()->create();
    $schedule = VolunteerSchedule::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->post(route('volunteer.decline', $schedule))
        ->assertRedirect();

    expect($schedule->fresh()->status->value)->toBe('declined');
});

it('prevents confirming another users duty', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $schedule = VolunteerSchedule::factory()->create(['user_id' => $otherUser->id]);

    $this->actingAs($user)
        ->post(route('volunteer.confirm', $schedule))
        ->assertForbidden();
});

it('prevents declining another users duty', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $schedule = VolunteerSchedule::factory()->create(['user_id' => $otherUser->id]);

    $this->actingAs($user)
        ->post(route('volunteer.decline', $schedule))
        ->assertForbidden();
});

it('requires authentication to confirm a duty', function () {
    $schedule = VolunteerSchedule::factory()->create();

    $this->post(route('volunteer.confirm', $schedule))
        ->assertRedirect(route('login'));
});
