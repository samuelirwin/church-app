<?php

namespace App\Enums;

enum MaritalStatus: string
{
    case Single = 'single';
    case Married = 'married';
    case Widowed = 'widowed';
    case Divorced = 'divorced';
    case Separated = 'separated';

    public function label(): string
    {
        return match ($this) {
            self::Single => 'Single',
            self::Married => 'Married',
            self::Widowed => 'Widowed',
            self::Divorced => 'Divorced',
            self::Separated => 'Separated',
        };
    }
}
