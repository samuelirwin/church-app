<?php

namespace Database\Factories;

use App\Enums\ContactMethod;
use App\Models\CareNeed;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CareNeedUpdate>
 */
class CareNeedUpdateFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'care_need_id' => CareNeed::factory(),
            'user_id' => User::factory(),
            'body' => fake()->sentence(),
            'contact_method' => ContactMethod::Note,
        ];
    }
}
