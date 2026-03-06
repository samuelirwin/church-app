<?php

use App\Models\Form;
use App\Models\FormResponse;
use App\Models\User;

it('displays a published form', function () {
    $form = Form::factory()->published()->create();

    $this->get(route('forms.show', $form))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/forms/show')
            ->has('form')
            ->where('hasResponded', false)
        );
});

it('returns 404 for unpublished forms', function () {
    $form = Form::factory()->unpublished()->create();

    $this->get(route('forms.show', $form))
        ->assertNotFound();
});

it('submits a response to a published form', function () {
    $user = User::factory()->create();
    $form = Form::factory()->published()->create([
        'fields' => [
            ['id' => 'name', 'type' => 'text', 'label' => 'Name', 'required' => true, 'step' => 1],
        ],
    ]);

    $this->actingAs($user)
        ->post(route('forms.submit', $form), [
            'answers' => ['name' => 'John Doe'],
        ])
        ->assertRedirect();

    expect($form->responses()->count())->toBe(1)
        ->and($form->responses()->first()->answers)->toBe(['name' => 'John Doe']);
});

it('allows anonymous submissions when enabled', function () {
    $form = Form::factory()->published()->anonymous()->create([
        'fields' => [
            ['id' => 'feedback', 'type' => 'textarea', 'label' => 'Feedback', 'required' => true, 'step' => 1],
        ],
    ]);

    $this->post(route('forms.submit', $form), [
        'answers' => ['feedback' => 'Great service!'],
    ])
        ->assertRedirect();

    expect($form->responses()->count())->toBe(1)
        ->and($form->responses()->first()->user_id)->toBeNull();
});

it('redirects to login when non-anonymous form submitted by guest', function () {
    $form = Form::factory()->published()->create([
        'allows_anonymous' => false,
        'fields' => [
            ['id' => 'name', 'type' => 'text', 'label' => 'Name', 'step' => 1],
        ],
    ]);

    $this->post(route('forms.submit', $form), [
        'answers' => ['name' => 'Test'],
    ])
        ->assertRedirect(route('login'));
});

it('prevents duplicate responses when one_response_per_user is enabled', function () {
    $user = User::factory()->create();
    $form = Form::factory()->published()->onePerUser()->create([
        'fields' => [
            ['id' => 'name', 'type' => 'text', 'label' => 'Name', 'required' => true, 'step' => 1],
        ],
    ]);

    // First submission
    $this->actingAs($user)
        ->post(route('forms.submit', $form), ['answers' => ['name' => 'John']]);

    // Second submission should be blocked
    $this->actingAs($user)
        ->post(route('forms.submit', $form), ['answers' => ['name' => 'John Again']])
        ->assertRedirect();

    expect($form->responses()->where('user_id', $user->id)->count())->toBe(1);
});

it('indicates hasResponded for users who already submitted', function () {
    $user = User::factory()->create();
    $form = Form::factory()->published()->onePerUser()->create();
    FormResponse::factory()->create([
        'form_id' => $form->id,
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('forms.show', $form))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('hasResponded', true)
        );
});

it('rejects submissions to expired forms', function () {
    $user = User::factory()->create();
    $form = Form::factory()->expired()->create([
        'fields' => [
            ['id' => 'name', 'type' => 'text', 'label' => 'Name', 'step' => 1],
        ],
    ]);

    $this->actingAs($user)
        ->post(route('forms.submit', $form), ['answers' => ['name' => 'Test']])
        ->assertRedirect();

    expect($form->responses()->count())->toBe(0);
});

it('rejects submissions when max responses reached', function () {
    $user = User::factory()->create();
    $form = Form::factory()->published()->maxResponses(1)->create([
        'fields' => [
            ['id' => 'name', 'type' => 'text', 'label' => 'Name', 'step' => 1],
        ],
    ]);
    FormResponse::factory()->create(['form_id' => $form->id]);

    $this->actingAs($user)
        ->post(route('forms.submit', $form), ['answers' => ['name' => 'Test']])
        ->assertRedirect();

    expect($form->responses()->count())->toBe(1);
});

it('validates required fields on submission', function () {
    $user = User::factory()->create();
    $form = Form::factory()->published()->create([
        'fields' => [
            ['id' => 'email', 'type' => 'email', 'label' => 'Email', 'required' => true, 'step' => 1],
        ],
    ]);

    $this->actingAs($user)
        ->post(route('forms.submit', $form), ['answers' => []])
        ->assertSessionHasErrors(['answers.email']);
});

it('records ip address and user agent on submission', function () {
    $user = User::factory()->create();
    $form = Form::factory()->published()->create([
        'fields' => [
            ['id' => 'name', 'type' => 'text', 'label' => 'Name', 'required' => true, 'step' => 1],
        ],
    ]);

    $this->actingAs($user)
        ->post(route('forms.submit', $form), ['answers' => ['name' => 'Test']]);

    $response = $form->responses()->first();
    expect($response->ip_address)->not->toBeNull()
        ->and($response->submitted_at)->not->toBeNull();
});
