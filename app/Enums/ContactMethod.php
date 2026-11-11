<?php

namespace App\Enums;

enum ContactMethod: string
{
    case Note = 'note';
    case Call = 'call';
    case Text = 'text';
    case Email = 'email';
    case Visit = 'visit';

    public function label(): string
    {
        return match ($this) {
            self::Note => 'Note',
            self::Call => 'Phone Call',
            self::Text => 'Text Message',
            self::Email => 'Email',
            self::Visit => 'Visit',
        };
    }
}
