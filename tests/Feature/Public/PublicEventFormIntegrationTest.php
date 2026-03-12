<?php

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Form;
use App\Models\FormResponse;
use App\Models\User;

it('shows event with registration form fields', function () {
    $form = Form::factory()->published()->create();
    $event = Event::factory()->published()->create(['form_id' => $form->id]);

    $this->get(route('events.show', $event->slug))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/events/show')
            ->has('event.data.registration_form')
            ->where('event.data.registration_form.id', $form->id)
            ->has('event.data.registration_form.fields')
        );
});

it('shows event without registration form when none linked', function () {
    $event = Event::factory()->published()->create(['form_id' => null]);

    $this->get(route('events.show', $event->slug))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/events/show')
            ->where('event.data.registration_form', null)
        );
});

it('allows guest registration with form answers', function () {
    $form = Form::factory()->published()->create([
        'fields' => [
            [
                'id' => 'field_1',
                'type' => 'text',
                'label' => 'Dietary Restrictions',
                'required' => true,
            ],
            [
                'id' => 'field_2',
                'type' => 'email',
                'label' => 'Alternate Email',
                'required' => false,
            ],
        ],
    ]);

    $event = Event::factory()->published()->create(['form_id' => $form->id]);

    $this->post(route('events.guest-register', $event->slug), [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'phone' => '555-1234',
        'answers' => [
            'field_1' => 'No nuts',
            'field_2' => 'alt@example.com',
        ],
    ])->assertRedirect();

    $registration = EventRegistration::where('event_id', $event->id)
        ->where('email', 'jane@example.com')
        ->first();

    expect($registration)->not->toBeNull();
    expect($registration->form_response_id)->not->toBeNull();

    $response = FormResponse::find($registration->form_response_id);
    expect($response)->not->toBeNull();
    expect($response->form_id)->toBe($form->id);
    expect($response->answers['field_1'])->toBe('No nuts');
    expect($response->answers['field_2'])->toBe('alt@example.com');
});

it('allows guest registration without form answers when no form linked', function () {
    $event = Event::factory()->published()->create(['form_id' => null]);

    $this->post(route('events.guest-register', $event->slug), [
        'name' => 'John Smith',
        'email' => 'john@example.com',
    ])->assertRedirect();

    $registration = EventRegistration::where('event_id', $event->id)
        ->where('email', 'john@example.com')
        ->first();

    expect($registration)->not->toBeNull();
    expect($registration->form_response_id)->toBeNull();
});

it('validates required form fields on guest registration', function () {
    $form = Form::factory()->published()->create([
        'fields' => [
            [
                'id' => 'field_req',
                'type' => 'text',
                'label' => 'Required Field',
                'required' => true,
            ],
        ],
    ]);

    $event = Event::factory()->published()->create(['form_id' => $form->id]);

    $this->post(route('events.guest-register', $event->slug), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'answers' => [
            'field_req' => '',
        ],
    ])->assertSessionHasErrors(['answers.field_req']);
});

it('allows member registration with form answers', function () {
    $user = User::factory()->create();
    $form = Form::factory()->published()->create([
        'fields' => [
            [
                'id' => 'member_field',
                'type' => 'text',
                'label' => 'T-shirt Size',
                'required' => true,
            ],
        ],
    ]);

    $event = Event::factory()->published()->create(['form_id' => $form->id]);

    $this->actingAs($user)
        ->post("/events/{$event->id}/rsvp", [
            'answers' => [
                'member_field' => 'Large',
            ],
        ])
        ->assertRedirect();

    $registration = EventRegistration::where('event_id', $event->id)
        ->where('user_id', $user->id)
        ->first();

    expect($registration)->not->toBeNull();
    expect($registration->form_response_id)->not->toBeNull();

    $response = FormResponse::find($registration->form_response_id);
    expect($response->user_id)->toBe($user->id);
    expect($response->answers['member_field'])->toBe('Large');
});

it('allows member registration without form answers when no form linked', function () {
    $user = User::factory()->create();
    $event = Event::factory()->published()->create(['form_id' => null]);

    $this->actingAs($user)
        ->post("/events/{$event->id}/rsvp")
        ->assertRedirect();

    $registration = EventRegistration::where('event_id', $event->id)
        ->where('user_id', $user->id)
        ->first();

    expect($registration)->not->toBeNull();
    expect($registration->form_response_id)->toBeNull();
});

it('validates required form fields on member registration', function () {
    $user = User::factory()->create();
    $form = Form::factory()->published()->create([
        'fields' => [
            [
                'id' => 'req_field',
                'type' => 'text',
                'label' => 'Required Info',
                'required' => true,
            ],
        ],
    ]);

    $event = Event::factory()->published()->create(['form_id' => $form->id]);

    $this->actingAs($user)
        ->post("/events/{$event->id}/rsvp", [
            'answers' => [
                'req_field' => '',
            ],
        ])
        ->assertSessionHasErrors(['answers.req_field']);
});

it('creates form response with scoring when event form has scoring enabled', function () {
    $form = Form::factory()->published()->create([
        'fields' => [
            [
                'id' => 'quiz_field',
                'type' => 'radio',
                'label' => 'What is 2+2?',
                'required' => true,
                'options' => [
                    ['label' => '3', 'value' => '3'],
                    ['label' => '4', 'value' => '4', 'correct' => true],
                    ['label' => '5', 'value' => '5'],
                ],
                'points' => 10,
            ],
        ],
        'settings' => [
            'scoring_enabled' => true,
            'show_results' => false,
            'one_response_per_user' => false,
        ],
    ]);

    $event = Event::factory()->published()->create(['form_id' => $form->id]);

    $this->post(route('events.guest-register', $event->slug), [
        'name' => 'Quiz Taker',
        'email' => 'quiz@example.com',
        'answers' => [
            'quiz_field' => '4',
        ],
    ])->assertRedirect();

    $registration = EventRegistration::where('email', 'quiz@example.com')->first();
    $response = FormResponse::find($registration->form_response_id);

    expect($response->score)->toBe(100);
});
