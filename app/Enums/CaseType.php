<?php

namespace App\Enums;

enum CaseType: string
{
    case Individual = 'individual';
    case Couples = 'couples';
    case Family = 'family';
    case Crisis = 'crisis';
    case Grief = 'grief';
    case Addiction = 'addiction';
    case PreMarital = 'pre_marital';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Individual => 'Individual',
            self::Couples => 'Couples',
            self::Family => 'Family',
            self::Crisis => 'Crisis',
            self::Grief => 'Grief',
            self::Addiction => 'Addiction',
            self::PreMarital => 'Pre-Marital',
            self::Other => 'Other',
        };
    }
}
