<?php

use App\Models\ServiceTime;
use App\Models\User;
use App\Models\VolunteerSchedule;

it('denies member access to service times index', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.service-times.index'))
        ->assertForbidden();
});

it('redirects admin from service times index to site settings', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.service-times.index'))
        ->assertRedirect(route('admin.site-settings.edit'));
});

it('allows admin to view create form', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.service-times.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/service-times/create')
        );
});

it('creates a service time', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.service-times.store'), [
            'name' => 'Afternoon',
            'sort_order' => 2,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    $this->assertDatabaseHas('service_times', [
        'name' => 'Afternoon',
        'slug' => 'afternoon',
        'sort_order' => 2,
        'is_active' => true,
    ]);
});

it('validates required name when creating', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.service-times.store'), [
            'name' => '',
        ])
        ->assertSessionHasErrors(['name']);
});

it('allows admin to view edit form', function () {
    $admin = User::factory()->admin()->create();
    $serviceTime = ServiceTime::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.service-times.edit', $serviceTime))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/service-times/edit')
            ->has('serviceTime')
        );
});

it('updates a service time', function () {
    $admin = User::factory()->admin()->create();
    $serviceTime = ServiceTime::factory()->create(['name' => 'Old Name']);

    $this->actingAs($admin)
        ->put(route('admin.service-times.update', $serviceTime), [
            'name' => 'New Name',
            'sort_order' => 5,
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    expect($serviceTime->fresh())
        ->name->toBe('New Name')
        ->sort_order->toBe(5)
        ->is_active->toBeFalse();
});

it('deletes a service time without schedules', function () {
    $admin = User::factory()->admin()->create();
    $serviceTime = ServiceTime::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.service-times.destroy', $serviceTime))
        ->assertRedirect(route('admin.site-settings.edit'));

    expect(ServiceTime::find($serviceTime->id))->toBeNull();
});

it('prevents deleting a service time with schedules', function () {
    $admin = User::factory()->admin()->create();
    $serviceTime = ServiceTime::factory()->create();
    VolunteerSchedule::factory()->create(['service_time_id' => $serviceTime->id]);

    $this->actingAs($admin)
        ->delete(route('admin.service-times.destroy', $serviceTime))
        ->assertRedirect(route('admin.site-settings.edit'))
        ->assertSessionHas('error');

    expect(ServiceTime::find($serviceTime->id))->not->toBeNull();
});
