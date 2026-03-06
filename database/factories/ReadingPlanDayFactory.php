<?php

namespace Database\Factories;

use App\Models\ReadingPlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ReadingPlanDay>
 */
class ReadingPlanDayFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'reading_plan_id' => ReadingPlan::factory(),
            'day_number' => fake()->unique()->numberBetween(1, 365),
            'title' => fake()->sentence(3),
            'scripture_reference' => fake()->randomElement([
                'Genesis 1:1-31',
                'Psalm 23:1-6',
                'Matthew 5:1-16',
                'John 3:16-21',
                'Romans 8:1-17',
                'Philippians 4:4-13',
            ]),
            'reflection' => fake()->optional()->paragraph(),
        ];
    }
}
