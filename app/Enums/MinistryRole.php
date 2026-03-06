<?php

namespace App\Enums;

enum MinistryRole: string
{
    case Leader = 'leader';
    case Member = 'member';
    case Volunteer = 'volunteer';

    public function label(): string
    {
        return match ($this) {
            self::Leader => 'Leader',
            self::Member => 'Member',
            self::Volunteer => 'Volunteer',
        };
    }
}
