<?php

namespace App\Enums;

enum BenevolentCategory: string
{
    case Financial = 'financial';
    case Housing = 'housing';
    case Utilities = 'utilities';
    case Medical = 'medical';
    case Food = 'food';
    case Transportation = 'transportation';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Financial => 'Financial',
            self::Housing => 'Housing',
            self::Utilities => 'Utilities',
            self::Medical => 'Medical',
            self::Food => 'Food',
            self::Transportation => 'Transportation',
            self::Other => 'Other',
        };
    }
}
