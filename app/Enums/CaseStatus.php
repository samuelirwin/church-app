<?php

namespace App\Enums;

enum CaseStatus: string
{
    case Open = 'open';
    case Active = 'active';
    case OnHold = 'on_hold';
    case ClosedResolved = 'closed_resolved';
    case ClosedReferred = 'closed_referred';
    case ClosedUnresolved = 'closed_unresolved';

    public function label(): string
    {
        return match ($this) {
            self::Open => 'Open',
            self::Active => 'Active',
            self::OnHold => 'On Hold',
            self::ClosedResolved => 'Closed (Resolved)',
            self::ClosedReferred => 'Closed (Referred)',
            self::ClosedUnresolved => 'Closed (Unresolved)',
        };
    }

    public function isClosed(): bool
    {
        return in_array($this, [
            self::ClosedResolved,
            self::ClosedReferred,
            self::ClosedUnresolved,
        ]);
    }
}
