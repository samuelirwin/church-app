<?php

namespace Database\Factories;

use App\Enums\PageLayout;
use App\Enums\PageSectionType;
use App\Enums\SectionAlignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Page>
 */
class PageFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->unique()->sentence(3),
            'description' => fake()->optional()->sentence(10),
            'redirect_url' => null,
            'layout' => PageLayout::FullWidth,
            'sections' => null,
            'is_published' => false,
            'category_id' => null,
            'created_by' => User::factory(),
            'sort_order' => 0,
        ];
    }

    /**
     * Mark the page as published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => true,
        ]);
    }

    /**
     * Mark the page as a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => false,
        ]);
    }

    /**
     * Set an external redirect URL.
     */
    public function redirect(string $url = 'https://example.com'): static
    {
        return $this->state(fn (array $attributes) => [
            'redirect_url' => $url,
        ]);
    }

    /**
     * Add sample sections to the page.
     */
    public function withSections(): static
    {
        return $this->state(fn (array $attributes) => [
            'sections' => [
                [
                    'id' => 'section_1',
                    'type' => PageSectionType::RichText->value,
                    'alignment' => SectionAlignment::Full->value,
                    'data' => [
                        'content' => '<p>'.fake()->paragraphs(2, true).'</p>',
                    ],
                ],
                [
                    'id' => 'section_2',
                    'type' => PageSectionType::CallToAction->value,
                    'alignment' => SectionAlignment::Center->value,
                    'data' => [
                        'heading' => fake()->sentence(4),
                        'body' => fake()->sentence(10),
                        'button_label' => 'Learn More',
                        'button_url' => '/sermons',
                    ],
                ],
            ],
        ]);
    }
}
