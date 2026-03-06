<?php

namespace App\Enums;

enum ScheduleStatus: string
{
    case Scheduled = 'scheduled';
    case Confirmed = 'confirmed';
    case Declined = 'declined';
    case Absent = 'absent';

    public function label(): string
    {
        return match ($this) {
            self::Scheduled => 'Scheduled',
            self::Confirmed => 'Confirmed',
            self::Declined => 'Declined',
            self::Absent => 'Absent',
        };
    }
}
