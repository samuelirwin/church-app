<?php

namespace Database\Factories;

use App\Enums\QuizQuestionType;
use App\Models\Quiz;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuizQuestion>
 */
class QuizQuestionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'question' => fake()->sentence().'?',
            'type' => QuizQuestionType::MultipleChoice,
            'options' => ['Option A', 'Option B', 'Option C', 'Option D'],
            'correct_answer' => ['Option A'],
            'points' => 1,
            'sort_order' => fake()->numberBetween(0, 10),
            'explanation' => fake()->optional()->sentence(),
        ];
    }

    /**
     * Create a true/false question.
     */
    public function trueFalse(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => QuizQuestionType::TrueFalse,
            'options' => ['True', 'False'],
            'correct_answer' => ['True'],
        ]);
    }

    /**
     * Create a short answer question.
     */
    public function shortAnswer(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => QuizQuestionType::ShortAnswer,
            'options' => null,
            'correct_answer' => [fake()->word()],
        ]);
    }
}
