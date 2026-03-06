<?php

namespace App\Enums;

enum ReviewRecommendation: string
{
    case Approve = 'approve';
    case Deny = 'deny';
    case NeedsMoreInfo = 'needs_more_info';

    public function label(): string
    {
        return match ($this) {
            self::Approve => 'Approve',
            self::Deny => 'Deny',
            self::NeedsMoreInfo => 'Needs More Info',
        };
    }
}
