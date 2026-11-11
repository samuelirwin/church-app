<?php

namespace Database\Factories;

use App\Enums\CareNeedPriority;
use App\Enums\CareNeedSource;
use App\Enums\CareNeedStatus;
use App\Enums\CareNeedType;
use App\Models\Member;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CareNeed>
 */
class CareNeedFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'member_id' => Member::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'type' => CareNeedType::HomeVisit,
            'priority' => CareNeedPriority::Normal,
            'status' => CareNeedStatus::Open,
            'source' => CareNeedSource::Manual,
        ];
    }

    public function ofType(CareNeedType $type): static
    {
        return $this->state(fn () => ['type' => $type]);
    }

    public function withStatus(CareNeedStatus $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }

    public function confidential(): static
    {
        return $this->state(fn () => ['is_confidential' => true]);
    }

    public function assignedTo(User $user): static
    {
        return $this->state(fn () => ['assigned_to' => $user->id]);
    }

    public function overdue(): static
    {
        return $this->state(fn () => ['due_on' => now()->subDays(2)->toDateString()]);
    }

    /**
     * A prayer request a member shared on the prayer wall.
     */
    public function onPrayerWall(): static
    {
        return $this->state(fn () => [
            'type' => CareNeedType::Prayer,
            'source' => CareNeedSource::MemberRequest,
            'share_on_prayer_wall' => true,
        ]);
    }

    public function requestedBy(Member $member): static
    {
        return $this->state(fn () => [
            'member_id' => $member->id,
            'source' => CareNeedSource::MemberRequest,
            'created_by' => $member->user_id,
        ]);
    }
}
