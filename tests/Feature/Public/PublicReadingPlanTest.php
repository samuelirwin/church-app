<?php

use App\Models\ReadingPlan;
use App\Models\ReadingPlanDay;

it('displays the public reading plans listing', function () {
    ReadingPlan::factory()->published()->count(3)->create();

    $this->get(route('reading-plans.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/reading-plans/index')
            ->has('plans.data', 3)
        );
});

it('only shows published plans on public listing', function () {
    ReadingPlan::factory()->published()->count(2)->create();
    ReadingPlan::factory()->unpublished()->create();

    $this->get(route('reading-plans.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('plans.data', 2)
        );
});

it('supports search on public reading plans page', function () {
    ReadingPlan::factory()->published()->create(['title' => 'Psalms of Praise']);
    ReadingPlan::factory()->published()->create(['title' => 'New Testament Overview']);

    $this->get(route('reading-plans.index', ['search' => 'Psalms']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('plans.data', 1)
            ->where('plans.data.0.title', 'Psalms of Praise')
        );
});

it('displays a published reading plan detail page', function () {
    $plan = ReadingPlan::factory()->published()->create();
    ReadingPlanDay::factory()->count(3)->create([
        'reading_plan_id' => $plan->id,
    ]);

    $this->get(route('reading-plans.show', $plan))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/reading-plans/show')
            ->has('plan')
            ->has('enrollment')
            ->has('completedDayIds')
        );
});

it('returns 404 for unpublished reading plans', function () {
    $plan = ReadingPlan::factory()->unpublished()->create();

    $this->get(route('reading-plans.show', $plan))
        ->assertNotFound();
});

it('includes enrollment data for authenticated users', function () {
    $plan = ReadingPlan::factory()->published()->create();
    $user = \App\Models\User::factory()->create();
    $enrollment = $plan->enrollments()->create([
        'user_id' => $user->id,
        'started_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('reading-plans.show', $plan))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('enrollment.id', $enrollment->id)
        );
});

it('returns null enrollment for unauthenticated users', function () {
    $plan = ReadingPlan::factory()->published()->create();

    $this->get(route('reading-plans.show', $plan))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('enrollment', null)
            ->where('completedDayIds', [])
        );
});
