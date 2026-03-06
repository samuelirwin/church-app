<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Visitor>
 */
class VisitorFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'first_visit_date' => fake()->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'follow_up_status' => 'new',
        ];
    }

    public function contacted(): static
    {
        return $this->state(fn () => ['follow_up_status' => 'contacted']);
    }

    public function followUp(): static
    {
        return $this->state(fn () => ['follow_up_status' => 'follow_up']);
    }

    public function connected(): static
    {
        return $this->state(fn () => ['follow_up_status' => 'connected']);
    }

    public function closed(): static
    {
        return $this->state(fn () => ['follow_up_status' => 'closed']);
    }

    public function assignedTo(User $user): static
    {
        return $this->state(fn () => ['assigned_to' => $user->id]);
    }

    public function converted(User $user): static
    {
        return $this->state(fn () => ['converted_to_user_id' => $user->id]);
    }
}
