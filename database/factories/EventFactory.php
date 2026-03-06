<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
class EventFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startsAt = fake()->dateTimeBetween('+1 day', '+30 days');

        return [
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'location' => fake()->address(),
            'starts_at' => $startsAt,
            'ends_at' => (clone $startsAt)->modify('+2 hours'),
            'is_all_day' => false,
            'recurrence' => 'none',
            'is_published' => true,
            'created_by' => User::factory(),
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'is_published' => true,
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'is_published' => false,
        ]);
    }

    public function upcoming(): static
    {
        return $this->state(fn () => [
            'starts_at' => now()->addDays(7),
            'ends_at' => now()->addDays(7)->addHours(2),
        ]);
    }

    public function past(): static
    {
        return $this->state(fn () => [
            'starts_at' => now()->subDays(7),
            'ends_at' => now()->subDays(7)->addHours(2),
        ]);
    }

    public function allDay(): static
    {
        return $this->state(fn () => [
            'is_all_day' => true,
            'ends_at' => null,
        ]);
    }

    public function withMaxAttendees(int $max = 50): static
    {
        return $this->state(fn () => [
            'max_attendees' => $max,
        ]);
    }
}
