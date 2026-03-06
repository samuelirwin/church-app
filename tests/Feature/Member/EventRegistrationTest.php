<?php

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\User;

it('requires authentication to register for an event', function () {
    $event = Event::factory()->published()->create();

    $this->post(route('events.register', $event))
        ->assertRedirect(route('login'));
});

it('allows authenticated user to register for an event', function () {
    $user = User::factory()->create();
    $event = Event::factory()->published()->create();

    $this->actingAs($user)
        ->post(route('events.register', $event))
        ->assertRedirect();

    expect(EventRegistration::where('event_id', $event->id)->where('user_id', $user->id)->exists())->toBeTrue();
});

it('prevents duplicate registration for same user', function () {
    $user = User::factory()->create();
    $event = Event::factory()->published()->create();

    EventRegistration::factory()->create([
        'event_id' => $event->id,
        'user_id' => $user->id,
        'email' => $user->email,
    ]);

    $this->actingAs($user)
        ->post(route('events.register', $event))
        ->assertRedirect();

    expect(EventRegistration::where('event_id', $event->id)->where('user_id', $user->id)->count())->toBe(1);
});

it('prevents registration when event is full', function () {
    $user = User::factory()->create();
    $event = Event::factory()->published()->withMaxAttendees(1)->create();
    EventRegistration::factory()->create(['event_id' => $event->id]);

    $this->actingAs($user)
        ->post(route('events.register', $event))
        ->assertRedirect();

    expect(EventRegistration::where('event_id', $event->id)->where('user_id', $user->id)->exists())->toBeFalse();
});

it('allows user to cancel registration', function () {
    $user = User::factory()->create();
    $event = Event::factory()->published()->create();
    EventRegistration::factory()->create([
        'event_id' => $event->id,
        'user_id' => $user->id,
        'email' => $user->email,
        'status' => 'registered',
    ]);

    $this->actingAs($user)
        ->post(route('events.cancel', $event))
        ->assertRedirect();

    expect(EventRegistration::where('event_id', $event->id)->where('user_id', $user->id)->first()->status->value)->toBe('cancelled');
});

it('prevents cancellation when no active registration exists', function () {
    $user = User::factory()->create();
    $event = Event::factory()->published()->create();

    $this->actingAs($user)
        ->post(route('events.cancel', $event))
        ->assertRedirect();
});

it('prevents registration for unpublished event', function () {
    $user = User::factory()->create();
    $event = Event::factory()->draft()->create();

    $this->actingAs($user)
        ->post(route('events.register', $event))
        ->assertNotFound();
});
