<?php

namespace App\Enums;

enum MembershipStatus: string
{
    case Visitor = 'visitor';
    case Regular = 'regular';
    case Member = 'member';
    case Inactive = 'inactive';
    case Transferred = 'transferred';
    case Deceased = 'deceased';

    public function label(): string
    {
        return match ($this) {
            self::Visitor => 'Visitor',
            self::Regular => 'Regular Attender',
            self::Member => 'Member',
            self::Inactive => 'Inactive',
            self::Transferred => 'Transferred',
            self::Deceased => 'Deceased',
        };
    }

    /**
     * Statuses that count as part of the active congregation.
     *
     * @return list<self>
     */
    public static function activeStatuses(): array
    {
        return [self::Visitor, self::Regular, self::Member];
    }

    public function isActive(): bool
    {
        return in_array($this, self::activeStatuses(), true);
    }
}
