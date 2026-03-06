<?php

namespace Database\Factories;

use App\Enums\CourseDifficulty;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Course>
 */
class CourseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->unique()->sentence(3),
            'description' => fake()->paragraph(),
            'category_id' => null,
            'difficulty' => fake()->randomElement(CourseDifficulty::cases()),
            'estimated_hours' => fake()->randomFloat(1, 1, 40),
            'is_published' => true,
            'requires_enrollment' => true,
            'max_enrollments' => null,
            'created_by' => User::factory(),
        ];
    }

    /**
     * Mark the course as published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => true,
        ]);
    }

    /**
     * Mark the course as unpublished.
     */
    public function unpublished(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => false,
        ]);
    }

    /**
     * Set a specific difficulty.
     */
    public function beginner(): static
    {
        return $this->state(fn (array $attributes) => [
            'difficulty' => CourseDifficulty::Beginner,
        ]);
    }

    /**
     * Set intermediate difficulty.
     */
    public function intermediate(): static
    {
        return $this->state(fn (array $attributes) => [
            'difficulty' => CourseDifficulty::Intermediate,
        ]);
    }

    /**
     * Set advanced difficulty.
     */
    public function advanced(): static
    {
        return $this->state(fn (array $attributes) => [
            'difficulty' => CourseDifficulty::Advanced,
        ]);
    }
}
