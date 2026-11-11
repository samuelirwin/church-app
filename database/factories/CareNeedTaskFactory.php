<?php

namespace Database\Factories;

use App\Models\CareNeed;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CareNeedTask>
 */
class CareNeedTaskFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'care_need_id' => CareNeed::factory(),
            'description' => 'Deliver dinner',
            'due_on' => now()->addDays(2)->toDateString(),
        ];
    }

    public function takenBy(User $user): static
    {
        return $this->state(fn () => ['volunteer_id' => $user->id]);
    }

    public function completed(): static
    {
        return $this->state(fn () => ['completed_at' => now()]);
    }
}
