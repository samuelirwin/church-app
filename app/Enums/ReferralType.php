<?php

namespace App\Enums;

enum ReferralType: string
{
    case Internal = 'internal';
    case External = 'external';
    case Medical = 'medical';
    case Legal = 'legal';
    case Financial = 'financial';
    case Spiritual = 'spiritual';

    public function label(): string
    {
        return match ($this) {
            self::Internal => 'Internal',
            self::External => 'External',
            self::Medical => 'Medical',
            self::Legal => 'Legal',
            self::Financial => 'Financial',
            self::Spiritual => 'Spiritual',
        };
    }
}
