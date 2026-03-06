<?php

use App\Models\GroupMember;
use App\Models\Ministry;
use App\Models\MinistryGroup;
use App\Models\MinistryMember;
use App\Models\User;

it('requires authentication to join a ministry', function () {
    $ministry = Ministry::factory()->create();

    $this->post(route('ministries.join', $ministry))
        ->assertRedirect(route('login'));
});

it('allows user to join a ministry', function () {
    $user = User::factory()->create();
    $ministry = Ministry::factory()->create();

    $this->actingAs($user)
        ->post(route('ministries.join', $ministry))
        ->assertRedirect();

    expect(MinistryMember::where('user_id', $user->id)->where('ministry_id', $ministry->id)->exists())->toBeTrue();
});

it('prevents duplicate ministry membership', function () {
    $user = User::factory()->create();
    $ministry = Ministry::factory()->create();
    MinistryMember::factory()->create(['user_id' => $user->id, 'ministry_id' => $ministry->id]);

    $this->actingAs($user)
        ->post(route('ministries.join', $ministry))
        ->assertRedirect();

    expect(MinistryMember::where('user_id', $user->id)->where('ministry_id', $ministry->id)->count())->toBe(1);
});

it('allows user to leave a ministry', function () {
    $user = User::factory()->create();
    $ministry = Ministry::factory()->create();
    MinistryMember::factory()->create(['user_id' => $user->id, 'ministry_id' => $ministry->id]);

    $this->actingAs($user)
        ->post(route('ministries.leave', $ministry))
        ->assertRedirect();

    expect(MinistryMember::where('user_id', $user->id)->where('ministry_id', $ministry->id)->exists())->toBeFalse();
});

it('allows user to join a group', function () {
    $user = User::factory()->create();
    $group = MinistryGroup::factory()->create();

    $this->actingAs($user)
        ->post(route('groups.join', $group))
        ->assertRedirect();

    expect(GroupMember::where('user_id', $user->id)->where('ministry_group_id', $group->id)->exists())->toBeTrue();
});

it('prevents duplicate group membership', function () {
    $user = User::factory()->create();
    $group = MinistryGroup::factory()->create();
    GroupMember::factory()->create(['user_id' => $user->id, 'ministry_group_id' => $group->id]);

    $this->actingAs($user)
        ->post(route('groups.join', $group))
        ->assertRedirect();

    expect(GroupMember::where('user_id', $user->id)->where('ministry_group_id', $group->id)->count())->toBe(1);
});

it('prevents joining a full group', function () {
    $user = User::factory()->create();
    $group = MinistryGroup::factory()->withMaxMembers(1)->create();
    GroupMember::factory()->create(['ministry_group_id' => $group->id]);

    $this->actingAs($user)
        ->post(route('groups.join', $group))
        ->assertRedirect();

    expect(GroupMember::where('user_id', $user->id)->where('ministry_group_id', $group->id)->exists())->toBeFalse();
});

it('allows user to leave a group', function () {
    $user = User::factory()->create();
    $group = MinistryGroup::factory()->create();
    GroupMember::factory()->create(['user_id' => $user->id, 'ministry_group_id' => $group->id]);

    $this->actingAs($user)
        ->post(route('groups.leave', $group))
        ->assertRedirect();

    expect(GroupMember::where('user_id', $user->id)->where('ministry_group_id', $group->id)->exists())->toBeFalse();
});
