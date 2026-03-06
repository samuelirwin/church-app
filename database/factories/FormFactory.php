<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Form>
 */
class FormFactory extends Factory
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
            'description' => fake()->paragraph(),
            'fields' => [
                [
                    'id' => fake()->uuid(),
                    'type' => 'text',
                    'label' => 'Your Name',
                    'placeholder' => 'Enter your name',
                    'required' => true,
                    'step' => 1,
                ],
                [
                    'id' => fake()->uuid(),
                    'type' => 'email',
                    'label' => 'Email Address',
                    'placeholder' => 'Enter your email',
                    'required' => true,
                    'step' => 1,
                ],
            ],
            'settings' => [
                'confirmation_message' => 'Thank you for your submission!',
                'redirect_url' => null,
                'scoring_enabled' => false,
                'show_results' => false,
                'one_response_per_user' => false,
            ],
            'is_multi_step' => false,
            'is_published' => true,
            'allows_anonymous' => false,
            'created_by' => User::factory(),
        ];
    }

    /**
     * Form is published.
     */
    public function published(): static
    {
        return $this->state(fn () => [
            'is_published' => true,
        ]);
    }

    /**
     * Form is unpublished / draft.
     */
    public function unpublished(): static
    {
        return $this->state(fn () => [
            'is_published' => false,
        ]);
    }

    /**
     * Form has expired.
     */
    public function expired(): static
    {
        return $this->state(fn () => [
            'is_published' => true,
            'expires_at' => now()->subDay(),
        ]);
    }

    /**
     * Form allows anonymous submissions.
     */
    public function anonymous(): static
    {
        return $this->state(fn () => [
            'allows_anonymous' => true,
        ]);
    }

    /**
     * Form with scoring enabled.
     */
    public function withScoring(): static
    {
        return $this->state(fn () => [
            'fields' => [
                [
                    'id' => fake()->uuid(),
                    'type' => 'radio',
                    'label' => 'What is 2+2?',
                    'required' => true,
                    'options' => [
                        ['label' => '3', 'value' => '3'],
                        ['label' => '4', 'value' => '4'],
                        ['label' => '5', 'value' => '5'],
                    ],
                    'points' => 10,
                    'step' => 1,
                ],
            ],
            'settings' => [
                'confirmation_message' => 'Thank you!',
                'scoring_enabled' => true,
                'show_results' => true,
                'one_response_per_user' => false,
            ],
        ]);
    }

    /**
     * Form with one response per user setting.
     */
    public function onePerUser(): static
    {
        return $this->state(fn () => [
            'settings' => [
                'confirmation_message' => 'Thank you!',
                'scoring_enabled' => false,
                'show_results' => false,
                'one_response_per_user' => true,
            ],
        ]);
    }

    /**
     * Form with max response limit.
     */
    public function maxResponses(int $max = 10): static
    {
        return $this->state(fn () => [
            'max_responses' => $max,
        ]);
    }
}
