<?php

use App\Enums\HouseholdRole;
use App\Models\Household;
use App\Models\Member;
use App\Models\User;

it('blocks leaders from households', function () {
    $this->actingAs(User::factory()->leader()->create())
        ->get(route('admin.households.index'))
        ->assertForbidden();
});

it('lists households with member counts', function () {
    $household = Household::factory()->create();
    Member::factory()->count(2)->inHousehold($household)->create();

    $this->actingAs(User::factory()->staff()->create())
        ->get(route('admin.households.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/households/index')
            ->has('households.data', 1)
            ->where('households.data.0.members_count', 2)
        );
});

it('creates a household', function () {
    $this->actingAs(User::factory()->staff()->create())
        ->post(route('admin.households.store'), ['name' => 'The Tan Family'])
        ->assertRedirect();

    expect(Household::where('name', 'The Tan Family')->exists())->toBeTrue();
});

it('requires a household name', function () {
    $this->actingAs(User::factory()->staff()->create())
        ->post(route('admin.households.store'), ['name' => ''])
        ->assertSessionHasErrors(['name' => 'The household name is required.']);
});

it('updates household details', function () {
    $household = Household::factory()->create();

    $this->actingAs(User::factory()->staff()->create())
        ->put(route('admin.households.update', $household), ['name' => 'Renamed', 'city' => 'Nazareth'])
        ->assertRedirect();

    expect($household->fresh())->name->toBe('Renamed')->city->toBe('Nazareth');
});

it('shows a household with unassigned members available to add', function () {
    $household = Household::factory()->create();
    Member::factory()->inHousehold($household, HouseholdRole::Head)->create();
    Member::factory()->create();

    $this->actingAs(User::factory()->staff()->create())
        ->get(route('admin.households.show', $household))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/households/show')
            ->has('household.data.members', 1)
            ->has('availableMembers', 1)
        );
});

it('adds and removes a household member', function () {
    $staff = User::factory()->staff()->create();
    $household = Household::factory()->create();
    $member = Member::factory()->create();

    $this->actingAs($staff)
        ->post(route('admin.households.members.store', $household), ['member_id' => $member->id, 'household_role' => 'spouse'])
        ->assertSessionHasNoErrors();

    expect($member->fresh())->household_id->toBe($household->id)->household_role->toBe(HouseholdRole::Spouse);

    $this->actingAs($staff)
        ->delete(route('admin.households.members.destroy', [$household, $member]))
        ->assertRedirect();

    expect($member->fresh())->household_id->toBeNull()->household_role->toBeNull();
});

it('validates adding a household member', function () {
    $household = Household::factory()->create();

    $this->actingAs(User::factory()->staff()->create())
        ->post(route('admin.households.members.store', $household), ['member_id' => 999, 'household_role' => 'cousin'])
        ->assertSessionHasErrors(['member_id', 'household_role']);
});

it('will not remove a member who belongs to a different household', function () {
    $household = Household::factory()->create();
    $member = Member::factory()->inHousehold(Household::factory()->create())->create();

    $this->actingAs(User::factory()->staff()->create())
        ->delete(route('admin.households.members.destroy', [$household, $member]))
        ->assertNotFound();
});

it('deletes a household but keeps its members', function () {
    $household = Household::factory()->create();
    $member = Member::factory()->inHousehold($household, HouseholdRole::Head)->create();

    $this->actingAs(User::factory()->staff()->create())
        ->delete(route('admin.households.destroy', $household))
        ->assertRedirect(route('admin.households.index'));

    expect(Household::find($household->id))->toBeNull()
        ->and($member->fresh())->not->toBeNull()
        ->and($member->fresh()->household_id)->toBeNull();
});
