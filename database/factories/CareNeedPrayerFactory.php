<?php

namespace Database\Factories;

use App\Models\CareNeed;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CareNeedPrayer>
 */
class CareNeedPrayerFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'care_need_id' => CareNeed::factory(),
            'user_id' => User::factory(),
        ];
    }
}
