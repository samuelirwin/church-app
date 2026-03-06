<?php

use App\Models\Event;
use App\Models\EventRegistration;

it('displays published events listing', function () {
    Event::factory()->published()->upcoming()->count(3)->create();
    Event::factory()->draft()->create();

    $this->get(route('events.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/events/index')
            ->has('events.data', 3)
        );
});

it('searches events by title', function () {
    Event::factory()->published()->create(['title' => 'Prayer Meeting']);
    Event::factory()->published()->create(['title' => 'Youth Camp']);

    $this->get(route('events.index', ['search' => 'Prayer']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
        );
});

it('displays a published event detail page', function () {
    $event = Event::factory()->published()->create();

    $this->get(route('events.show', $event->slug))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/events/show')
            ->has('event')
        );
});

it('returns 404 for unpublished event', function () {
    $event = Event::factory()->draft()->create();

    $this->get(route('events.show', $event->slug))
        ->assertNotFound();
});

it('allows guest registration for an event', function () {
    $event = Event::factory()->published()->create();

    $this->post(route('events.guest-register', $event->slug), [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'phone' => '012-345-6789',
    ])->assertRedirect();

    expect(EventRegistration::where('event_id', $event->id)->where('email', 'john@example.com')->exists())->toBeTrue();
});

it('validates guest registration fields', function () {
    $event = Event::factory()->published()->create();

    $this->post(route('events.guest-register', $event->slug), [])
        ->assertSessionHasErrors(['name', 'email']);
});

it('prevents duplicate guest registration for same email', function () {
    $event = Event::factory()->published()->create();
    EventRegistration::factory()->create([
        'event_id' => $event->id,
        'email' => 'john@example.com',
    ]);

    $this->post(route('events.guest-register', $event->slug), [
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ])->assertRedirect();

    expect(EventRegistration::where('event_id', $event->id)->where('email', 'john@example.com')->count())->toBe(1);
});

it('prevents registration when event is full', function () {
    $event = Event::factory()->published()->withMaxAttendees(1)->create();
    EventRegistration::factory()->create(['event_id' => $event->id]);

    $this->post(route('events.guest-register', $event->slug), [
        'name' => 'Jane Smith',
        'email' => 'jane@example.com',
    ])->assertRedirect();

    expect(EventRegistration::where('event_id', $event->id)->count())->toBe(1);
});

it('prevents guest registration for unpublished event', function () {
    $event = Event::factory()->draft()->create();

    $this->post(route('events.guest-register', $event->slug), [
        'name' => 'Test',
        'email' => 'test@example.com',
    ])->assertNotFound();
});
