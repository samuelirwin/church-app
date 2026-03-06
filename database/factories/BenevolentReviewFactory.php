<?php

namespace Database\Factories;

use App\Enums\ReviewRecommendation;
use App\Models\BenevolentRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BenevolentReview>
 */
class BenevolentReviewFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'benevolent_request_id' => BenevolentRequest::factory(),
            'user_id' => User::factory(),
            'recommendation' => ReviewRecommendation::Approve,
            'amount_recommended' => fake()->randomFloat(2, 50, 5000),
            'comments' => fake()->sentence(),
            'reviewed_at' => now(),
        ];
    }

    public function approve(): static
    {
        return $this->state(fn () => [
            'recommendation' => ReviewRecommendation::Approve,
        ]);
    }

    public function deny(): static
    {
        return $this->state(fn () => [
            'recommendation' => ReviewRecommendation::Deny,
        ]);
    }

    public function needsMoreInfo(): static
    {
        return $this->state(fn () => [
            'recommendation' => ReviewRecommendation::NeedsMoreInfo,
        ]);
    }
}
