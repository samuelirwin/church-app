<?php

namespace App\Enums;

enum MenuItemTarget: string
{
    case Self = '_self';
    case Blank = '_blank';

    public function label(): string
    {
        return match ($this) {
            self::Self => 'Same Window',
            self::Blank => 'New Tab',
        };
    }
}
