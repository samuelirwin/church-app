<?php

use App\Models\ReadingPlan;
use App\Models\ReadingPlanDay;
use App\Models\User;

it('auto-generates slug from title on creation', function () {
    $plan = ReadingPlan::factory()->create(['title' => 'Through the Bible in 30 Days']);

    expect($plan->slug)->toBe('through-the-bible-in-30-days');
});

it('scopes to published plans only', function () {
    ReadingPlan::factory()->published()->create();
    ReadingPlan::factory()->unpublished()->create();

    expect(ReadingPlan::published()->count())->toBe(1);
});

it('belongs to a creator', function () {
    $user = User::factory()->create();
    $plan = ReadingPlan::factory()->create(['created_by' => $user->id]);

    expect($plan->creator->id)->toBe($user->id);
});

it('has many days ordered by day_number', function () {
    $plan = ReadingPlan::factory()->create();
    ReadingPlanDay::factory()->create(['reading_plan_id' => $plan->id, 'day_number' => 3]);
    ReadingPlanDay::factory()->create(['reading_plan_id' => $plan->id, 'day_number' => 1]);
    ReadingPlanDay::factory()->create(['reading_plan_id' => $plan->id, 'day_number' => 2]);

    $days = $plan->days;

    expect($days)->toHaveCount(3)
        ->and($days->first()->day_number)->toBe(1)
        ->and($days->last()->day_number)->toBe(3);
});

it('has many enrollments', function () {
    $plan = ReadingPlan::factory()->create();
    $plan->enrollments()->create([
        'user_id' => User::factory()->create()->id,
        'started_at' => now(),
    ]);

    expect($plan->enrollments)->toHaveCount(1);
});

it('casts is_published as boolean', function () {
    $plan = ReadingPlan::factory()->create();

    expect($plan->is_published)->toBeBool();
});

it('casts duration_days as integer', function () {
    $plan = ReadingPlan::factory()->create(['duration_days' => 14]);

    expect($plan->duration_days)->toBeInt()
        ->and($plan->duration_days)->toBe(14);
});
