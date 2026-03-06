<?php

namespace App\Enums;

enum BenevolentStatus: string
{
    case Pending = 'pending';
    case UnderReview = 'under_review';
    case Approved = 'approved';
    case PartiallyApproved = 'partially_approved';
    case Denied = 'denied';
    case Disbursed = 'disbursed';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::UnderReview => 'Under Review',
            self::Approved => 'Approved',
            self::PartiallyApproved => 'Partially Approved',
            self::Denied => 'Denied',
            self::Disbursed => 'Disbursed',
            self::Closed => 'Closed',
        };
    }
}
