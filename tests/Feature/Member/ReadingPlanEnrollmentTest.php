<?php

use App\Models\ReadingPlan;
use App\Models\ReadingPlanDay;
use App\Models\User;

it('requires authentication to enroll in a reading plan', function () {
    $plan = ReadingPlan::factory()->published()->create();

    $this->post(route('reading-plans.enroll', $plan))
        ->assertRedirect(route('login'));
});

it('enrolls a user in a published reading plan', function () {
    $user = User::factory()->create();
    $plan = ReadingPlan::factory()->published()->create();

    $this->actingAs($user)
        ->post(route('reading-plans.enroll', $plan))
        ->assertRedirect();

    expect($plan->enrollments()->where('user_id', $user->id)->exists())->toBeTrue();
});

it('prevents duplicate enrollment in the same plan', function () {
    $user = User::factory()->create();
    $plan = ReadingPlan::factory()->published()->create();
    $plan->enrollments()->create([
        'user_id' => $user->id,
        'started_at' => now(),
    ]);

    $this->actingAs($user)
        ->post(route('reading-plans.enroll', $plan))
        ->assertRedirect();

    expect($plan->enrollments()->where('user_id', $user->id)->count())->toBe(1);
});

it('returns 404 when enrolling in unpublished plan', function () {
    $user = User::factory()->create();
    $plan = ReadingPlan::factory()->unpublished()->create();

    $this->actingAs($user)
        ->post(route('reading-plans.enroll', $plan))
        ->assertNotFound();
});

it('marks a day as complete for an enrolled user', function () {
    $user = User::factory()->create();
    $plan = ReadingPlan::factory()->published()->create(['duration_days' => 7]);
    $day = ReadingPlanDay::factory()->create([
        'reading_plan_id' => $plan->id,
        'day_number' => 1,
    ]);
    $enrollment = $plan->enrollments()->create([
        'user_id' => $user->id,
        'started_at' => now(),
    ]);

    $this->actingAs($user)
        ->patch(route('reading-plans.progress', [$plan, $day]))
        ->assertRedirect();

    expect($enrollment->progress()->where('day_id', $day->id)->exists())->toBeTrue();
});

it('prevents marking the same day complete twice', function () {
    $user = User::factory()->create();
    $plan = ReadingPlan::factory()->published()->create(['duration_days' => 7]);
    $day = ReadingPlanDay::factory()->create([
        'reading_plan_id' => $plan->id,
        'day_number' => 1,
    ]);
    $enrollment = $plan->enrollments()->create([
        'user_id' => $user->id,
        'started_at' => now(),
    ]);
    $enrollment->progress()->create([
        'day_id' => $day->id,
        'completed_at' => now(),
    ]);

    $this->actingAs($user)
        ->patch(route('reading-plans.progress', [$plan, $day]))
        ->assertRedirect();

    expect($enrollment->progress()->where('day_id', $day->id)->count())->toBe(1);
});

it('auto-completes the plan when all days are finished', function () {
    $user = User::factory()->create();
    $plan = ReadingPlan::factory()->published()->create(['duration_days' => 2]);
    $day1 = ReadingPlanDay::factory()->create([
        'reading_plan_id' => $plan->id,
        'day_number' => 1,
    ]);
    $day2 = ReadingPlanDay::factory()->create([
        'reading_plan_id' => $plan->id,
        'day_number' => 2,
    ]);
    $enrollment = $plan->enrollments()->create([
        'user_id' => $user->id,
        'started_at' => now(),
    ]);

    // Complete day 1
    $enrollment->progress()->create([
        'day_id' => $day1->id,
        'completed_at' => now(),
    ]);

    // Complete day 2 - should auto-complete the plan
    $this->actingAs($user)
        ->patch(route('reading-plans.progress', [$plan, $day2]))
        ->assertRedirect();

    expect($enrollment->fresh()->completed_at)->not->toBeNull();
});

it('requires enrollment before marking progress', function () {
    $user = User::factory()->create();
    $plan = ReadingPlan::factory()->published()->create();
    $day = ReadingPlanDay::factory()->create([
        'reading_plan_id' => $plan->id,
        'day_number' => 1,
    ]);

    $this->actingAs($user)
        ->patch(route('reading-plans.progress', [$plan, $day]))
        ->assertNotFound();
});

it('requires authentication to mark progress', function () {
    $plan = ReadingPlan::factory()->published()->create();
    $day = ReadingPlanDay::factory()->create([
        'reading_plan_id' => $plan->id,
        'day_number' => 1,
    ]);

    $this->patch(route('reading-plans.progress', [$plan, $day]))
        ->assertRedirect(route('login'));
});
