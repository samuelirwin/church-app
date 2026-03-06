<?php

namespace App\Enums;

enum GoalStatus: string
{
    case Active = 'active';
    case InProgress = 'in_progress';
    case Achieved = 'achieved';
    case Deferred = 'deferred';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::InProgress => 'In Progress',
            self::Achieved => 'Achieved',
            self::Deferred => 'Deferred',
        };
    }
}
