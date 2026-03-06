<?php

namespace Database\Factories;

use App\Enums\LessonContentType;
use App\Models\CourseModule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Lesson>
 */
class LessonFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'module_id' => CourseModule::factory(),
            'title' => fake()->sentence(3),
            'content_type' => LessonContentType::Text,
            'body' => fake()->paragraphs(3, true),
            'video_url' => null,
            'duration_minutes' => fake()->numberBetween(5, 60),
            'sort_order' => fake()->numberBetween(0, 10),
            'is_free_preview' => false,
        ];
    }

    /**
     * Mark as a video lesson.
     */
    public function video(): static
    {
        return $this->state(fn (array $attributes) => [
            'content_type' => LessonContentType::Video,
            'video_url' => 'https://www.youtube.com/watch?v='.fake()->regexify('[A-Za-z0-9]{11}'),
        ]);
    }

    /**
     * Mark as a free preview lesson.
     */
    public function freePreview(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_free_preview' => true,
        ]);
    }
}
