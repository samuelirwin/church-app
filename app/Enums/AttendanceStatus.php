<?php

namespace App\Enums;

/**
 * Only attendance is recorded. A member with no record for a session was absent.
 */
enum AttendanceStatus: string
{
    case Present = 'present';
    case Excused = 'excused';

    public function label(): string
    {
        return match ($this) {
            self::Present => 'Present',
            self::Excused => 'Excused',
        };
    }
}
