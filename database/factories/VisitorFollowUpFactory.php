<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Visitor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\VisitorFollowUp>
 */
class VisitorFollowUpFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'visitor_id' => Visitor::factory(),
            'user_id' => User::factory(),
            'type' => fake()->randomElement(['call', 'email', 'visit', 'text']),
            'notes' => fake()->sentence(),
            'followed_up_at' => fake()->dateTimeBetween('-7 days', 'now'),
        ];
    }
}
