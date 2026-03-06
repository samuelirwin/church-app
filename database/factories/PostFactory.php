<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Post>
 */
class PostFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->unique()->sentence(4),
            'excerpt' => fake()->optional()->sentence(10),
            'body' => fake()->paragraphs(3, true),
            'category_id' => null,
            'is_featured' => false,
            'published_at' => fake()->optional(0.8)->dateTimeBetween('-6 months', 'now'),
            'author_id' => User::factory(),
        ];
    }

    /**
     * Mark the post as published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => now()->subDay(),
        ]);
    }

    /**
     * Mark the post as a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => null,
        ]);
    }

    /**
     * Mark the post as featured.
     */
    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
            'published_at' => now()->subDay(),
        ]);
    }
}
