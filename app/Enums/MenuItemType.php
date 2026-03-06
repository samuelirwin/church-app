<?php

namespace App\Enums;

enum MenuItemType: string
{
    case InternalPage = 'internal_page';
    case CustomUrl = 'custom_url';
    case Page = 'page';

    public function label(): string
    {
        return match ($this) {
            self::InternalPage => 'Internal Page',
            self::CustomUrl => 'Custom URL',
            self::Page => 'Page',
        };
    }
}
