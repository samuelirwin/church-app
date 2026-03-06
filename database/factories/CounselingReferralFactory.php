<?php

namespace Database\Factories;

use App\Enums\ReferralType;
use App\Models\CounselingCase;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CounselingReferral>
 */
class CounselingReferralFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'counseling_case_id' => CounselingCase::factory(),
            'referred_to' => fake()->company(),
            'referral_type' => ReferralType::External,
            'referral_date' => fake()->date(),
            'reason' => fake()->paragraph(),
            'outcome' => fake()->optional()->sentence(),
            'referred_by' => User::factory(),
        ];
    }

    public function internal(): static
    {
        return $this->state(fn () => [
            'referral_type' => ReferralType::Internal,
        ]);
    }

    public function external(): static
    {
        return $this->state(fn () => [
            'referral_type' => ReferralType::External,
        ]);
    }

    public function medical(): static
    {
        return $this->state(fn () => [
            'referral_type' => ReferralType::Medical,
        ]);
    }

    public function legal(): static
    {
        return $this->state(fn () => [
            'referral_type' => ReferralType::Legal,
        ]);
    }

    public function financial(): static
    {
        return $this->state(fn () => [
            'referral_type' => ReferralType::Financial,
        ]);
    }

    public function spiritual(): static
    {
        return $this->state(fn () => [
            'referral_type' => ReferralType::Spiritual,
        ]);
    }
}
