<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SiteSetting>
 */
class SiteSettingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'group' => 'general',
            'key' => fake()->unique()->word(),
            'value' => fake()->sentence(),
        ];
    }

    public function general(): static
    {
        return $this->state(fn () => ['group' => 'general']);
    }

    public function social(): static
    {
        return $this->state(fn () => ['group' => 'social']);
    }
}
