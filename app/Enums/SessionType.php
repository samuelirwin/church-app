<?php

namespace App\Enums;

enum SessionType: string
{
    case InPerson = 'in_person';
    case Phone = 'phone';
    case Video = 'video';
    case GroupSession = 'group_session';

    public function label(): string
    {
        return match ($this) {
            self::InPerson => 'In Person',
            self::Phone => 'Phone',
            self::Video => 'Video',
            self::GroupSession => 'Group Session',
        };
    }
}
