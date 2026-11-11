<?php

namespace App\Enums;

enum CareNeedSource: string
{
    case Manual = 'manual';
    case MemberRequest = 'member_request';
    case Absence = 'absence';

    public function label(): string
    {
        return match ($this) {
            self::Manual => 'Added by staff',
            self::MemberRequest => 'Member request',
            self::Absence => 'Absence alert',
        };
    }
}
