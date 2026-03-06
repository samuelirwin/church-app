<?php

namespace App\Enums;

enum SectionAlignment: string
{
    case Left = 'left';
    case Right = 'right';
    case Center = 'center';
    case Full = 'full';

    public function label(): string
    {
        return match ($this) {
            self::Left => 'Left',
            self::Right => 'Right',
            self::Center => 'Center',
            self::Full => 'Full Width',
        };
    }
}
