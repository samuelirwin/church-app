<?php

use App\Enums\UserRole;
use App\Models\User;

it('denies member access to user listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

it('allows admin access to user listing', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->has('users')
            ->has('activeTab')
            ->has('staffCount')
            ->has('memberCount')
            ->has('filters')
        );
});

it('denies staff access to user listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

it('denies leader access to user listing', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

it('shows the edit user page', function () {
    $admin = User::factory()->admin()->create();
    $target = User::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.users.edit', $target))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/edit')
            ->has('user')
            ->has('roles')
        );
});

it('updates a user role', function () {
    $admin = User::factory()->admin()->create();
    $target = User::factory()->create();

    $this->actingAs($admin)
        ->patch(route('admin.users.update', $target), [
            'role' => 'staff',
        ])
        ->assertRedirect(route('admin.users.index'));

    expect($target->fresh()->role)->toBe(UserRole::Staff);
});

it('validates role on update', function () {
    $admin = User::factory()->admin()->create();
    $target = User::factory()->create();

    $this->actingAs($admin)
        ->patch(route('admin.users.update', $target), [
            'role' => 'invalid-role',
        ])
        ->assertSessionHasErrors('role');
});

it('defaults to staff tab showing admin, staff, and leader users', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->staff()->create(['name' => 'Staff User']);
    User::factory()->leader()->create(['name' => 'Leader User']);
    User::factory()->create(['name' => 'Regular Member']);

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->where('activeTab', 'staff')
            ->where('users.data', fn ($users) => collect($users)->every(
                fn ($u) => in_array($u['role'], ['admin', 'staff', 'leader'])
            ))
        );
});

it('shows only members on the members tab', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->staff()->create(['name' => 'Staff User']);
    User::factory()->create(['name' => 'Regular Member']);

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['tab' => 'members']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->where('activeTab', 'members')
            ->where('users.data', fn ($users) => collect($users)->every(
                fn ($u) => $u['role'] === 'member'
            ))
        );
});

it('returns correct staff and member counts', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->staff()->create();
    User::factory()->leader()->create();
    User::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('staffCount', 3)
            ->where('memberCount', 3)
        );
});

it('filters users by search within the active tab', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->staff()->create(['name' => 'John Staff']);
    User::factory()->staff()->create(['name' => 'Jane Staff']);

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['search' => 'John', 'tab' => 'staff']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->where('users.data', fn ($users) => collect($users)->every(
                fn ($u) => str_contains($u['name'], 'John')
            ))
        );
});
