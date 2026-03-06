<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Book>
 */
class BookFactory extends Factory
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
            'author' => fake()->name(),
            'isbn' => fake()->isbn13(),
            'publisher' => fake()->company(),
            'description' => fake()->paragraphs(2, true),
            'total_copies' => 3,
            'available_copies' => 3,
            'location' => 'Shelf '.fake()->randomLetter().fake()->randomDigit(),
            'is_published' => true,
        ];
    }

    /**
     * Book is published.
     */
    public function published(): static
    {
        return $this->state(fn () => [
            'is_published' => true,
        ]);
    }

    /**
     * Book is unpublished / draft.
     */
    public function unpublished(): static
    {
        return $this->state(fn () => [
            'is_published' => false,
        ]);
    }

    /**
     * Book has no available copies.
     */
    public function unavailable(): static
    {
        return $this->state(fn () => [
            'available_copies' => 0,
        ]);
    }
}
