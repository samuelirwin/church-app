<?php

use App\Enums\CategoryType;
use App\Models\Category;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Tag;
use App\Models\User;

it('denies member access to event listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.events.index'))
        ->assertForbidden();
});

it('allows staff to view event listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.events.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/events/index')
            ->has('events')
            ->has('filters')
            ->has('categories')
        );
});

it('shows the create event page', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.events.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/events/create')
            ->has('categories')
            ->has('forms')
        );
});

it('creates an event with valid data', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.events.store'), [
            'title' => 'Sunday Service',
            'description' => '<p>Weekly Sunday worship service.</p>',
            'location' => 'Main Sanctuary',
            'starts_at' => now()->addDays(7)->format('Y-m-d H:i:s'),
            'is_published' => true,
        ])
        ->assertRedirect(route('admin.events.index'));

    expect(Event::where('title', 'Sunday Service')->exists())->toBeTrue();
});

it('validates required fields when creating an event', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.events.store'), [])
        ->assertSessionHasErrors(['title', 'starts_at']);
});

it('updates an event', function () {
    $staff = User::factory()->staff()->create();
    $event = Event::factory()->create();

    $this->actingAs($staff)
        ->put(route('admin.events.update', $event), [
            'title' => 'Updated Event',
            'starts_at' => now()->addDays(14)->format('Y-m-d H:i:s'),
            'is_published' => true,
        ])
        ->assertRedirect(route('admin.events.index'));

    expect($event->fresh()->title)->toBe('Updated Event');
});

it('deletes an event', function () {
    $staff = User::factory()->staff()->create();
    $event = Event::factory()->create();

    $this->actingAs($staff)
        ->delete(route('admin.events.destroy', $event))
        ->assertRedirect(route('admin.events.index'));

    expect(Event::find($event->id))->toBeNull();
});

it('searches events by title', function () {
    $staff = User::factory()->staff()->create();
    Event::factory()->create(['title' => 'Youth Night']);
    Event::factory()->create(['title' => 'Bible Study']);

    $this->actingAs($staff)
        ->get(route('admin.events.index', ['search' => 'Youth']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
        );
});

it('filters events by category', function () {
    $staff = User::factory()->staff()->create();
    $category = Category::factory()->create(['type' => CategoryType::Event]);
    Event::factory()->create(['category_id' => $category->id]);
    Event::factory()->create(['category_id' => null]);

    $this->actingAs($staff)
        ->get(route('admin.events.index', ['category_id' => $category->id]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
        );
});

it('displays event registrations page', function () {
    $staff = User::factory()->staff()->create();
    $event = Event::factory()->create();
    EventRegistration::factory()->count(3)->create(['event_id' => $event->id]);

    $this->actingAs($staff)
        ->get(route('admin.events.registrations', $event))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/events/registrations')
            ->has('registrations.data', 3)
        );
});

it('creates an event with tags', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.events.store'), [
            'title' => 'Tagged Event',
            'starts_at' => now()->addDays(7)->format('Y-m-d H:i:s'),
            'is_published' => true,
            'tags' => ['youth', 'worship'],
        ])
        ->assertRedirect(route('admin.events.index'));

    $event = Event::where('title', 'Tagged Event')->first();
    expect($event->tags)->toHaveCount(2)
        ->and(Tag::count())->toBe(2);
});

it('updates event tags', function () {
    $staff = User::factory()->staff()->create();
    $event = Event::factory()->create();
    $event->syncTags(['old-tag']);

    $this->actingAs($staff)
        ->put(route('admin.events.update', $event), [
            'title' => $event->title,
            'starts_at' => $event->starts_at->format('Y-m-d H:i:s'),
            'is_published' => true,
            'tags' => ['new-tag', 'another'],
        ])
        ->assertRedirect(route('admin.events.index'));

    expect($event->fresh()->tags)->toHaveCount(2)
        ->and($event->fresh()->tags->pluck('name')->toArray())->toEqualCanonicalizing(['new-tag', 'another']);
});
