<?php

namespace Database\Factories;

use App\Enums\MenuItemTarget;
use App\Enums\MenuItemType;
use App\Models\MenuItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MenuItem>
 */
class MenuItemFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'label' => fake()->words(2, true),
            'type' => MenuItemType::InternalPage,
            'route' => '/'.fake()->slug(2),
            'target' => MenuItemTarget::Self,
            'sort_order' => fake()->numberBetween(0, 20),
            'is_active' => true,
        ];
    }

    public function customUrl(): static
    {
        return $this->state(fn () => [
            'type' => MenuItemType::CustomUrl,
            'url' => fake()->url(),
            'route' => null,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }

    public function childOf(MenuItem $parent): static
    {
        return $this->state(fn () => ['parent_id' => $parent->id]);
    }

    public function newTab(): static
    {
        return $this->state(fn () => ['target' => MenuItemTarget::Blank]);
    }
}
