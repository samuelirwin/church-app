<?php

use App\Models\ReadingPlan;
use App\Models\ReadingPlanDay;
use App\Models\ReadingPlanEnrollment;
use App\Models\User;

it('belongs to a user and a reading plan', function () {
    $user = User::factory()->create();
    $plan = ReadingPlan::factory()->create();
    $enrollment = ReadingPlanEnrollment::factory()->create([
        'user_id' => $user->id,
        'reading_plan_id' => $plan->id,
    ]);

    expect($enrollment->user->id)->toBe($user->id)
        ->and($enrollment->readingPlan->id)->toBe($plan->id);
});

it('reports isCompleted when completed_at is set', function () {
    $enrollment = ReadingPlanEnrollment::factory()->completed()->create();

    expect($enrollment->isCompleted())->toBeTrue();
});

it('reports not completed when completed_at is null', function () {
    $enrollment = ReadingPlanEnrollment::factory()->create();

    expect($enrollment->isCompleted())->toBeFalse();
});

it('calculates completion percentage correctly', function () {
    $plan = ReadingPlan::factory()->create(['duration_days' => 10]);
    $enrollment = ReadingPlanEnrollment::factory()->create([
        'reading_plan_id' => $plan->id,
    ]);

    // Add 3 completed days out of 10
    for ($i = 1; $i <= 3; $i++) {
        $day = ReadingPlanDay::factory()->create([
            'reading_plan_id' => $plan->id,
            'day_number' => $i,
        ]);
        $enrollment->progress()->create([
            'day_id' => $day->id,
            'completed_at' => now(),
        ]);
    }

    expect($enrollment->completionPercentage())->toBe(30);
});

it('returns zero percentage when plan has no days configured', function () {
    $plan = ReadingPlan::factory()->create(['duration_days' => 0]);
    $enrollment = ReadingPlanEnrollment::factory()->create([
        'reading_plan_id' => $plan->id,
    ]);

    expect($enrollment->completionPercentage())->toBe(0);
});

it('casts started_at and completed_at as datetime', function () {
    $enrollment = ReadingPlanEnrollment::factory()->completed()->create();

    expect($enrollment->started_at)->toBeInstanceOf(\DateTimeInterface::class)
        ->and($enrollment->completed_at)->toBeInstanceOf(\DateTimeInterface::class);
});
