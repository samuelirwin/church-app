<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Quiz>
 */
class QuizFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'lesson_id' => Lesson::factory(),
            'course_id' => null,
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->paragraph(),
            'passing_score' => 70,
            'time_limit_minutes' => null,
            'max_attempts' => null,
        ];
    }

    /**
     * Attach quiz to a course instead of a lesson.
     */
    public function forCourse(): static
    {
        return $this->state(fn (array $attributes) => [
            'lesson_id' => null,
            'course_id' => Course::factory(),
        ]);
    }
}
