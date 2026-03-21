<?php

use App\Models\Ministry;
use App\Models\User;
use App\Models\VolunteerRole;

it('denies member access to volunteer role listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.volunteer-roles.index'))
        ->assertForbidden();
});

it('redirects admin from volunteer roles index to site settings', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.volunteer-roles.index'))
        ->assertRedirect(route('admin.site-settings.edit'));
});

it('creates a volunteer role', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.volunteer-roles.store'), [
            'name' => 'Sound Operator',
            'description' => '<p>Handles audio equipment.</p>',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    expect(VolunteerRole::where('name', 'Sound Operator')->exists())->toBeTrue();
});

it('creates a volunteer role with ministry', function () {
    $admin = User::factory()->admin()->create();
    $ministry = Ministry::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.volunteer-roles.store'), [
            'name' => 'Worship Leader',
            'ministry_id' => $ministry->id,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    expect(VolunteerRole::where('name', 'Worship Leader')->first()->ministry_id)->toBe($ministry->id);
});

it('validates required fields when creating a role', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.volunteer-roles.store'), [])
        ->assertSessionHasErrors(['name']);
});

it('updates a volunteer role', function () {
    $admin = User::factory()->admin()->create();
    $role = VolunteerRole::factory()->create();

    $this->actingAs($admin)
        ->put(route('admin.volunteer-roles.update', $role), [
            'name' => 'Updated Role',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    expect($role->fresh()->name)->toBe('Updated Role');
});

it('deletes a volunteer role', function () {
    $admin = User::factory()->admin()->create();
    $role = VolunteerRole::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.volunteer-roles.destroy', $role))
        ->assertRedirect(route('admin.site-settings.edit'));

    expect(VolunteerRole::find($role->id))->toBeNull();
});
