<?php

namespace Database\Factories;

use App\Enums\GoalStatus;
use App\Models\CounselingCase;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CounselingGoal>
 */
class CounselingGoalFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'counseling_case_id' => CounselingCase::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->paragraph(),
            'target_date' => fake()->optional()->dateTimeBetween('now', '+90 days'),
            'status' => GoalStatus::Active,
            'priority' => fake()->numberBetween(0, 10),
            'created_by' => User::factory(),
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'status' => GoalStatus::Active,
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn () => [
            'status' => GoalStatus::InProgress,
        ]);
    }

    public function achieved(): static
    {
        return $this->state(fn () => [
            'status' => GoalStatus::Achieved,
        ]);
    }

    public function deferred(): static
    {
        return $this->state(fn () => [
            'status' => GoalStatus::Deferred,
        ]);
    }
}
