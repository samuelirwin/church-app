<?php

namespace App\Enums;

enum CareNeedStatus: string
{
    case Open = 'open';
    case InProgress = 'in_progress';
    case Resolved = 'resolved';
    case Closed = 'closed';
    case Escalated = 'escalated';

    public function label(): string
    {
        return match ($this) {
            self::Open => 'Open',
            self::InProgress => 'In Progress',
            self::Resolved => 'Resolved',
            self::Closed => 'Closed',
            self::Escalated => 'Escalated',
        };
    }

    /**
     * Statuses that still need someone to act on them.
     *
     * @return list<self>
     */
    public static function activeStatuses(): array
    {
        return [self::Open, self::InProgress];
    }

    public function isActive(): bool
    {
        return in_array($this, self::activeStatuses(), true);
    }
}
