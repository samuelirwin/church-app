<?php

use App\Models\Highlight;

it('displays only active highlights on public listing', function () {
    // Active
    Highlight::factory()->create([
        'is_active' => true,
        'starts_at' => now()->subDay(),
        'ends_at' => now()->addDays(7),
    ]);

    // Inactive
    Highlight::factory()->inactive()->create();

    // Expired
    Highlight::factory()->expired()->create();

    $this->get(route('highlights.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/highlights/index')
            ->has('highlights.data', 1)
        );
});

it('orders highlights by priority descending', function () {
    Highlight::factory()->create([
        'title' => 'Low Priority',
        'priority' => 1,
        'is_active' => true,
        'starts_at' => now()->subDay(),
        'ends_at' => now()->addDays(7),
    ]);

    Highlight::factory()->create([
        'title' => 'High Priority',
        'priority' => 10,
        'is_active' => true,
        'starts_at' => now()->subDay(),
        'ends_at' => now()->addDays(7),
    ]);

    $this->get(route('highlights.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('highlights.data', 2)
            ->where('highlights.data.0.title', 'High Priority')
            ->where('highlights.data.1.title', 'Low Priority')
        );
});

it('shows empty state when no active highlights', function () {
    Highlight::factory()->inactive()->create();

    $this->get(route('highlights.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('highlights.data', 0)
        );
});
