<?php

namespace App\Enums;

enum FollowUpStatus: string
{
    case New = 'new';
    case Contacted = 'contacted';
    case FollowUp = 'follow_up';
    case Connected = 'connected';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::New => 'New',
            self::Contacted => 'Contacted',
            self::FollowUp => 'Follow Up',
            self::Connected => 'Connected',
            self::Closed => 'Closed',
        };
    }
}
