<?php

namespace App\Enums;

enum CheckInMethod: string
{
    case Admin = 'admin';
    case SelfQr = 'self_qr';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Roll Call',
            self::SelfQr => 'Self Check-in',
        };
    }
}
