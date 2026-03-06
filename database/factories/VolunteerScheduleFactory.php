<?php

namespace Database\Factories;

use App\Models\ServiceTime;
use App\Models\User;
use App\Models\VolunteerRole;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\VolunteerSchedule>
 */
class VolunteerScheduleFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user = User::factory();

        return [
            'volunteer_role_id' => VolunteerRole::factory(),
            'user_id' => $user,
            'scheduled_date' => fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'service_time_id' => ServiceTime::factory(),
            'status' => 'scheduled',
            'notes' => null,
            'scheduled_by' => $user,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn () => ['status' => 'confirmed']);
    }

    public function declined(): static
    {
        return $this->state(fn () => ['status' => 'declined']);
    }

    public function absent(): static
    {
        return $this->state(fn () => ['status' => 'absent']);
    }
}
