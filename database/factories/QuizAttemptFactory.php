<?php

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuizAttempt>
 */
class QuizAttemptFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'user_id' => User::factory(),
            'answers' => [],
            'score' => 0,
            'passed' => false,
            'started_at' => now(),
            'completed_at' => null,
        ];
    }

    /**
     * Mark the attempt as completed and passed.
     */
    public function passed(): static
    {
        return $this->state(fn (array $attributes) => [
            'score' => 85,
            'passed' => true,
            'completed_at' => now(),
        ]);
    }

    /**
     * Mark the attempt as completed but failed.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'score' => 40,
            'passed' => false,
            'completed_at' => now(),
        ]);
    }
}
