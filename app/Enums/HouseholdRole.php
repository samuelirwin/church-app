<?php

namespace App\Enums;

enum HouseholdRole: string
{
    case Head = 'head';
    case Spouse = 'spouse';
    case Child = 'child';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Head => 'Head',
            self::Spouse => 'Spouse',
            self::Child => 'Child',
            self::Other => 'Other',
        };
    }
}
