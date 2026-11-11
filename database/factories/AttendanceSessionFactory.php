<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\MinistryGroup;
use App\Models\ServiceTime;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AttendanceSession>
 */
class AttendanceSessionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'attendable_type' => ServiceTime::class,
            'attendable_id' => ServiceTime::factory(),
            'occurred_on' => now()->toDateString(),
            'guest_count' => 0,
        ];
    }

    public function forService(ServiceTime $serviceTime): static
    {
        return $this->state(fn () => ['attendable_type' => ServiceTime::class, 'attendable_id' => $serviceTime->id]);
    }

    public function forEvent(Event $event): static
    {
        return $this->state(fn () => ['attendable_type' => Event::class, 'attendable_id' => $event->id]);
    }

    public function forGroup(MinistryGroup $group): static
    {
        return $this->state(fn () => ['attendable_type' => MinistryGroup::class, 'attendable_id' => $group->id]);
    }

    public function on(string $date): static
    {
        return $this->state(fn () => ['occurred_on' => $date]);
    }
}
