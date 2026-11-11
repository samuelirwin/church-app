<?php

use App\Enums\MembershipStatus;
use App\Models\Member;
use App\Models\User;

it('creates a member record on first visit if the user has none', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('member-profile.edit'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('settings/member-profile'));

    expect($user->member()->exists())->toBeTrue();
});

it('lets a member update their own details', function () {
    $member = Member::factory()->withUser()->create();

    $this->actingAs($member->user)
        ->patch(route('member-profile.update'), ['phone' => '555-0123', 'city' => 'Bethlehem'])
        ->assertRedirect(route('member-profile.edit'))
        ->assertSessionHasNoErrors();

    expect($member->fresh())->phone->toBe('555-0123')->city->toBe('Bethlehem');
});

it('ignores fields members are not allowed to change', function () {
    $member = Member::factory()->withUser()->regular()->create(['notes' => 'Staff only']);

    $this->actingAs($member->user)
        ->patch(route('member-profile.update'), ['membership_status' => 'member', 'notes' => 'Changed']);

    expect($member->fresh())
        ->membership_status->toBe(MembershipStatus::Regular)
        ->notes->toBe('Staff only');
});

it('validates the member profile', function () {
    $member = Member::factory()->withUser()->create();

    $this->actingAs($member->user)
        ->patch(route('member-profile.update'), ['date_of_birth' => now()->addYear()->toDateString(), 'gender' => 'x'])
        ->assertSessionHasErrors(['date_of_birth', 'gender']);
});

it('requires authentication', function () {
    $this->get(route('member-profile.edit'))->assertRedirect(route('login'));
});
