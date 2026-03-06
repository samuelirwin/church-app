<?php

namespace Database\Factories;

use App\Enums\DocumentVisibility;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Document>
 */
class DocumentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'description' => fake()->paragraphs(2, true),
            'visibility' => DocumentVisibility::Public,
            'uploaded_by' => User::factory(),
            'is_published' => true,
        ];
    }

    /**
     * Document is published.
     */
    public function published(): static
    {
        return $this->state(fn () => [
            'is_published' => true,
        ]);
    }

    /**
     * Document is unpublished / draft.
     */
    public function unpublished(): static
    {
        return $this->state(fn () => [
            'is_published' => false,
        ]);
    }

    /**
     * Document has public visibility.
     */
    public function public(): static
    {
        return $this->state(fn () => [
            'visibility' => DocumentVisibility::Public,
        ]);
    }

    /**
     * Document is visible to members only.
     */
    public function membersOnly(): static
    {
        return $this->state(fn () => [
            'visibility' => DocumentVisibility::Members,
        ]);
    }

    /**
     * Document is visible to admin/staff only.
     */
    public function adminOnly(): static
    {
        return $this->state(fn () => [
            'visibility' => DocumentVisibility::Admin,
        ]);
    }
}
