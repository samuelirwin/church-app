<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SermonSeries>
 */
class SermonSeriesFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->unique()->words(3, true),
            'description' => fake()->optional()->paragraph(),
            'start_date' => fake()->dateTimeBetween('-6 months', 'now'),
            'end_date' => null,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    /**
     * Mark the series as inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Mark the series as completed with an end date.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'end_date' => fake()->dateTimeBetween('-3 months', 'now'),
            'is_active' => false,
        ]);
    }
}
