<?php

namespace Database\Factories;

use App\Enums\AttendanceStatus;
use App\Enums\CheckInMethod;
use App\Models\AttendanceSession;
use App\Models\Member;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AttendanceRecord>
 */
class AttendanceRecordFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'attendance_session_id' => AttendanceSession::factory(),
            'member_id' => Member::factory(),
            'status' => AttendanceStatus::Present,
            'check_in_method' => CheckInMethod::Admin,
            'checked_in_at' => now(),
        ];
    }

    public function excused(): static
    {
        return $this->state(fn () => ['status' => AttendanceStatus::Excused]);
    }
}
