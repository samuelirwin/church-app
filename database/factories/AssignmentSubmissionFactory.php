<?php

namespace Database\Factories;

use App\Models\Assignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AssignmentSubmission>
 */
class AssignmentSubmissionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'assignment_id' => Assignment::factory(),
            'user_id' => User::factory(),
            'content' => fake()->paragraphs(2, true),
            'score' => null,
            'feedback' => null,
            'submitted_at' => now(),
            'graded_at' => null,
            'graded_by' => null,
        ];
    }

    /**
     * Mark as graded.
     */
    public function graded(): static
    {
        return $this->state(fn (array $attributes) => [
            'score' => fake()->numberBetween(60, 100),
            'feedback' => fake()->sentence(),
            'graded_at' => now(),
            'graded_by' => User::factory()->staff(),
        ]);
    }
}
