<?php

namespace Database\Factories;

use App\Enums\CaseStatus;
use App\Enums\CaseType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CounselingCase>
 */
class CounselingCaseFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'person_name' => fake()->name(),
            'person_contact' => fake()->phoneNumber(),
            'person_email' => fake()->safeEmail(),
            'case_type' => fake()->randomElement(CaseType::cases()),
            'status' => CaseStatus::Open,
            'presenting_issue' => fake()->paragraphs(2, true),
            'background_notes' => fake()->optional()->paragraph(),
            'referral_source' => fake()->optional()->company(),
            'assigned_counselor_id' => User::factory(),
            'opened_by' => User::factory(),
            'opened_at' => now(),
        ];
    }

    public function open(): static
    {
        return $this->state(fn () => [
            'status' => CaseStatus::Open,
        ]);
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'status' => CaseStatus::Active,
        ]);
    }

    public function onHold(): static
    {
        return $this->state(fn () => [
            'status' => CaseStatus::OnHold,
        ]);
    }

    public function closedResolved(): static
    {
        return $this->state(fn () => [
            'status' => CaseStatus::ClosedResolved,
            'closed_at' => now(),
            'closure_reason' => fake()->sentence(),
        ]);
    }

    public function closedReferred(): static
    {
        return $this->state(fn () => [
            'status' => CaseStatus::ClosedReferred,
            'closed_at' => now(),
            'closure_reason' => fake()->sentence(),
        ]);
    }

    public function assignedTo(User $user): static
    {
        return $this->state(fn () => [
            'assigned_counselor_id' => $user->id,
        ]);
    }

    public function openedBy(User $user): static
    {
        return $this->state(fn () => [
            'opened_by' => $user->id,
        ]);
    }
}
