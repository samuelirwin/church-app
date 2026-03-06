<?php

namespace App\Enums;

enum FollowUpType: string
{
    case Call = 'call';
    case Email = 'email';
    case Visit = 'visit';
    case Text = 'text';

    public function label(): string
    {
        return match ($this) {
            self::Call => 'Call',
            self::Email => 'Email',
            self::Visit => 'Visit',
            self::Text => 'Text',
        };
    }
}
