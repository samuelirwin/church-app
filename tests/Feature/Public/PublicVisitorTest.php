<?php

use App\Models\Visitor;

it('displays the visitor registration page', function () {
    $this->get(route('visit'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/visitors/register')
        );
});

it('registers a new visitor', function () {
    $this->post(route('visit.register'), [
        'name' => 'John Smith',
        'email' => 'john@example.com',
        'phone' => '555-1234',
        'first_visit_date' => now()->format('Y-m-d'),
        'how_heard' => 'Friend/Family',
    ])
        ->assertRedirect(route('visit'));

    expect(Visitor::where('name', 'John Smith')->exists())->toBeTrue();
});

it('validates required fields on registration', function () {
    $this->post(route('visit.register'), [])
        ->assertSessionHasErrors(['name', 'first_visit_date']);
});

it('allows registration without optional fields', function () {
    $this->post(route('visit.register'), [
        'name' => 'Jane Doe',
        'first_visit_date' => now()->format('Y-m-d'),
    ])
        ->assertRedirect(route('visit'));

    expect(Visitor::where('name', 'Jane Doe')->exists())->toBeTrue();
});

it('validates email format when provided', function () {
    $this->post(route('visit.register'), [
        'name' => 'Test User',
        'email' => 'not-an-email',
        'first_visit_date' => now()->format('Y-m-d'),
    ])
        ->assertSessionHasErrors(['email']);
});

it('sets default follow-up status to new', function () {
    $this->post(route('visit.register'), [
        'name' => 'New Visitor',
        'first_visit_date' => now()->format('Y-m-d'),
    ]);

    expect(Visitor::where('name', 'New Visitor')->first()->follow_up_status->value)->toBe('new');
});
