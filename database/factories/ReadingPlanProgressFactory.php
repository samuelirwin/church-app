<?php

namespace Database\Factories;

use App\Models\ReadingPlanDay;
use App\Models\ReadingPlanEnrollment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ReadingPlanProgress>
 */
class ReadingPlanProgressFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'enrollment_id' => ReadingPlanEnrollment::factory(),
            'day_id' => ReadingPlanDay::factory(),
            'completed_at' => now(),
        ];
    }
}
