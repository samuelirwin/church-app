<?php

namespace Database\Factories;

use App\Enums\DisbursementMethod;
use App\Models\BenevolentRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BenevolentDisbursement>
 */
class BenevolentDisbursementFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'benevolent_request_id' => BenevolentRequest::factory(),
            'amount' => fake()->randomFloat(2, 50, 2000),
            'method' => DisbursementMethod::Cash,
            'reference_number' => fake()->bothify('REF-####'),
            'disbursed_by' => User::factory(),
            'disbursed_at' => now(),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function cash(): static
    {
        return $this->state(fn () => [
            'method' => DisbursementMethod::Cash,
        ]);
    }

    public function check(): static
    {
        return $this->state(fn () => [
            'method' => DisbursementMethod::Check,
        ]);
    }

    public function directPayment(): static
    {
        return $this->state(fn () => [
            'method' => DisbursementMethod::DirectPayment,
        ]);
    }

    public function giftCard(): static
    {
        return $this->state(fn () => [
            'method' => DisbursementMethod::GiftCard,
        ]);
    }
}
