<?php

namespace Database\Factories;

use App\Enums\MembershipStatus;
use App\Models\Member;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MemberStatusChange>
 */
class MemberStatusChangeFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'member_id' => Member::factory(),
            'from_status' => MembershipStatus::Regular,
            'to_status' => MembershipStatus::Member,
            'reason' => fake()->sentence(),
        ];
    }
}
