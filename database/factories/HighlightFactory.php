<?php

namespace Database\Factories;

use App\Enums\HighlightType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Highlight>
 */
class HighlightFactory extends Factory
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
            'body' => fake()->paragraphs(2, true),
            'type' => fake()->randomElement(HighlightType::cases()),
            'priority' => fake()->numberBetween(1, 10),
            'is_active' => true,
            'starts_at' => now()->subDays(5),
            'ends_at' => now()->addDays(30),
            'author_id' => User::factory(),
        ];
    }

    /**
     * Mark the highlight as inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Mark the highlight as expired.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'starts_at' => now()->subDays(30),
            'ends_at' => now()->subDay(),
        ]);
    }
}
