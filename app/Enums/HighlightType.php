<?php

namespace App\Enums;

enum HighlightType: string
{
    case Announcement = 'announcement';
    case Event = 'event';
    case Campaign = 'campaign';
    case Testimony = 'testimony';

    public function label(): string
    {
        return match ($this) {
            self::Announcement => 'Announcement',
            self::Event => 'Event',
            self::Campaign => 'Campaign',
            self::Testimony => 'Testimony',
        };
    }
}
