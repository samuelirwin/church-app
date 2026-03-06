<?php

namespace App\Enums;

enum PageLayout: string
{
    case FullWidth = 'full_width';
    case SidebarRight = 'sidebar_right';
    case SidebarLeft = 'sidebar_left';
    case TwoColumn = 'two_column';
    case Landing = 'landing';

    public function label(): string
    {
        return match ($this) {
            self::FullWidth => 'Full Width',
            self::SidebarRight => 'Sidebar Right',
            self::SidebarLeft => 'Sidebar Left',
            self::TwoColumn => 'Two Column',
            self::Landing => 'Landing Page',
        };
    }
}
