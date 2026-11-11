<?php

namespace Database\Factories;

use App\Enums\HouseholdRole;
use App\Enums\MembershipStatus;
use App\Models\Household;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Member>
 */
class MemberFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'date_of_birth' => fake()->dateTimeBetween('-70 years', '-18 years')->format('Y-m-d'),
            'gender' => fake()->randomElement(['male', 'female']),
            'membership_status' => MembershipStatus::Member,
            'joined_at' => fake()->dateTimeBetween('-10 years', 'now')->format('Y-m-d'),
        ];
    }

    public function withStatus(MembershipStatus $status): static
    {
        return $this->state(fn () => ['membership_status' => $status]);
    }

    public function inactive(): static
    {
        return $this->withStatus(MembershipStatus::Inactive);
    }

    public function regular(): static
    {
        return $this->withStatus(MembershipStatus::Regular);
    }

    public function child(): static
    {
        return $this->state(fn () => [
            'email' => null,
            'date_of_birth' => fake()->dateTimeBetween('-12 years', '-2 years')->format('Y-m-d'),
            'household_role' => HouseholdRole::Child,
        ]);
    }

    /**
     * Link the member to a login account. Creates one when none is given.
     */
    public function withUser(?User $user = null): static
    {
        return $this->state(function () use ($user) {
            $user ??= User::factory()->create();
            $nameParts = explode(' ', $user->name, 2);

            return [
                'user_id' => $user->id,
                'first_name' => $nameParts[0],
                'last_name' => $nameParts[1] ?? null,
                'email' => $user->email,
            ];
        });
    }

    public function inHousehold(Household $household, HouseholdRole $role = HouseholdRole::Other): static
    {
        return $this->state(fn () => [
            'household_id' => $household->id,
            'household_role' => $role,
        ]);
    }
}
