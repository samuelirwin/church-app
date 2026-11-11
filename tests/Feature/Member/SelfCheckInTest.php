<?php

use App\Enums\CheckInMethod;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Household;
use App\Models\Member;

it('shows the check-in page with the household', function () {
    $household = Household::factory()->create();
    $member = Member::factory()->withUser()->inHousehold($household)->create();
    Member::factory()->child()->inHousehold($household)->create();
    $session = AttendanceSession::factory()->create();

    $this->actingAs($member->user)
        ->get(route('check-in.show', $session->check_in_token))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('member/check-in')
            ->has('people', 2)
            ->where('session.is_open', true)
        );
});

it('checks in the member and their household', function () {
    $household = Household::factory()->create();
    $member = Member::factory()->withUser()->inHousehold($household)->create();
    $child = Member::factory()->child()->inHousehold($household)->create();
    $session = AttendanceSession::factory()->create();

    $this->actingAs($member->user)
        ->post(route('check-in.store', $session->check_in_token), ['member_ids' => [$member->id, $child->id]])
        ->assertSessionHas('success', 'You are checked in. Welcome!');

    expect($session->records()->count())->toBe(2)
        ->and($session->records()->first()->check_in_method)->toBe(CheckInMethod::SelfQr);
});

it('tells the member when they were already checked in', function () {
    $member = Member::factory()->withUser()->create();
    $session = AttendanceSession::factory()->create();
    AttendanceRecord::factory()->create(['attendance_session_id' => $session->id, 'member_id' => $member->id]);

    $this->actingAs($member->user)
        ->post(route('check-in.store', $session->check_in_token), ['member_ids' => [$member->id]])
        ->assertSessionHas('success', 'You were already checked in.');
});

it('will not check in someone outside the household', function () {
    $member = Member::factory()->withUser()->create();
    $stranger = Member::factory()->create();
    $session = AttendanceSession::factory()->create();

    $this->actingAs($member->user)
        ->post(route('check-in.store', $session->check_in_token), ['member_ids' => [$stranger->id]])
        ->assertSessionHasErrors('member_ids.0');

    expect($session->records()->count())->toBe(0);
});

it('is closed on any day other than the session date', function () {
    $member = Member::factory()->withUser()->create();
    $session = AttendanceSession::factory()->on(now()->subDays(3)->toDateString())->create();

    $this->actingAs($member->user)
        ->post(route('check-in.store', $session->check_in_token), ['member_ids' => [$member->id]])
        ->assertSessionHas('error');

    expect($session->records()->count())->toBe(0);
});

it('returns 404 for an unknown token', function () {
    $this->actingAs(Member::factory()->withUser()->create()->user)
        ->get(route('check-in.show', 'not-a-real-token'))
        ->assertNotFound();
});

it('sends guests to the login page', function () {
    $session = AttendanceSession::factory()->create();

    $this->get(route('check-in.show', $session->check_in_token))->assertRedirect(route('login'));
});
