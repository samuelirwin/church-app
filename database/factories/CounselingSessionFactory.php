<?php

namespace Database\Factories;

use App\Enums\SessionType;
use App\Models\CounselingCase;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CounselingSession>
 */
class CounselingSessionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'counseling_case_id' => CounselingCase::factory(),
            'counselor_id' => User::factory(),
            'session_date' => fake()->dateTimeBetween('-30 days', 'now'),
            'duration_minutes' => fake()->randomElement([30, 45, 60, 90]),
            'session_type' => SessionType::InPerson,
            'notes' => fake()->optional()->paragraph(),
            'mood_rating' => fake()->optional()->numberBetween(1, 10),
            'progress_notes' => fake()->optional()->sentence(),
            'next_session_date' => fake()->optional()->dateTimeBetween('now', '+30 days'),
        ];
    }

    public function inPerson(): static
    {
        return $this->state(fn () => [
            'session_type' => SessionType::InPerson,
        ]);
    }

    public function phone(): static
    {
        return $this->state(fn () => [
            'session_type' => SessionType::Phone,
        ]);
    }

    public function video(): static
    {
        return $this->state(fn () => [
            'session_type' => SessionType::Video,
        ]);
    }

    public function groupSession(): static
    {
        return $this->state(fn () => [
            'session_type' => SessionType::GroupSession,
        ]);
    }
}
