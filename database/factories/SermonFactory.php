<?php

namespace Database\Factories;

use App\Models\Speaker;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Sermon>
 */
class SermonFactory extends Factory
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
            'description' => fake()->paragraph(),
            'notes' => fake()->optional()->paragraphs(3, true),
            'scripture_references' => [fake()->randomElement(['John 3:16', 'Romans 8:28', 'Psalm 23:1', 'Matthew 5:1-12'])],
            'sermon_date' => fake()->dateTimeBetween('-6 months', 'now'),
            'is_current_week' => false,
            'video_url' => fake()->optional()->url(),
            'speaker_id' => Speaker::factory(),
            'series_id' => null,
            'published_at' => fake()->optional(0.8)->dateTimeBetween('-6 months', 'now'),
            'created_by' => User::factory(),
        ];
    }

    /**
     * Mark the sermon as published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => now()->subDay(),
        ]);
    }

    /**
     * Mark the sermon as unpublished/draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => null,
        ]);
    }

    /**
     * Mark the sermon as current week.
     */
    public function currentWeek(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_current_week' => true,
            'sermon_date' => now()->previous('Sunday'),
            'published_at' => now()->subDay(),
        ]);
    }
}
