<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BookLending>
 */
class BookLendingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'book_id' => Book::factory(),
            'user_id' => User::factory(),
            'borrowed_at' => now(),
            'due_at' => now()->addWeeks(2),
            'lent_by' => User::factory(),
        ];
    }

    /**
     * Lending has been returned.
     */
    public function returned(): static
    {
        return $this->state(fn () => [
            'returned_at' => now(),
            'returned_to' => User::factory(),
        ]);
    }

    /**
     * Lending is overdue.
     */
    public function overdue(): static
    {
        return $this->state(fn () => [
            'borrowed_at' => now()->subWeeks(3),
            'due_at' => now()->subWeek(),
        ]);
    }
}
