<?php

namespace Database\Factories;

use App\Models\Ministry;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MinistryMember>
 */
class MinistryMemberFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'ministry_id' => Ministry::factory(),
            'role' => 'member',
            'joined_at' => now(),
        ];
    }
}
