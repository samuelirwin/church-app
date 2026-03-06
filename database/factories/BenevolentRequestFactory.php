<?php

namespace Database\Factories;

use App\Enums\BenevolentCategory;
use App\Enums\BenevolentStatus;
use App\Enums\BenevolentUrgency;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BenevolentRequest>
 */
class BenevolentRequestFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'requester_name' => fake()->name(),
            'requester_contact' => fake()->phoneNumber(),
            'category' => fake()->randomElement(BenevolentCategory::cases()),
            'description' => fake()->paragraphs(2, true),
            'amount_requested' => fake()->randomFloat(2, 50, 5000),
            'urgency' => BenevolentUrgency::Medium,
            'status' => BenevolentStatus::Pending,
            'created_by' => User::factory(),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => BenevolentStatus::Pending,
        ]);
    }

    public function underReview(): static
    {
        return $this->state(fn () => [
            'status' => BenevolentStatus::UnderReview,
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => BenevolentStatus::Approved,
            'amount_approved' => fake()->randomFloat(2, 50, 5000),
            'final_decision_by' => User::factory(),
            'final_decision_at' => now(),
        ]);
    }

    public function denied(): static
    {
        return $this->state(fn () => [
            'status' => BenevolentStatus::Denied,
            'final_decision_by' => User::factory(),
            'final_decision_at' => now(),
            'final_decision_notes' => fake()->sentence(),
        ]);
    }

    public function disbursed(): static
    {
        return $this->state(fn () => [
            'status' => BenevolentStatus::Disbursed,
            'amount_approved' => fake()->randomFloat(2, 50, 5000),
            'final_decision_by' => User::factory(),
            'final_decision_at' => now(),
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn () => [
            'status' => BenevolentStatus::Closed,
            'final_decision_by' => User::factory(),
            'final_decision_at' => now(),
        ]);
    }

    public function urgent(): static
    {
        return $this->state(fn () => [
            'urgency' => BenevolentUrgency::Critical,
        ]);
    }

    public function createdBy(User $user): static
    {
        return $this->state(fn () => [
            'created_by' => $user->id,
        ]);
    }
}
