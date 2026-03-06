<?php

namespace App\Enums;

enum DocumentVisibility: string
{
    case Public = 'public';
    case Members = 'members';
    case Admin = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::Public => 'Public',
            self::Members => 'Members Only',
            self::Admin => 'Admin/Staff Only',
        };
    }
}
