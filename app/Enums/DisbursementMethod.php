<?php

namespace App\Enums;

enum DisbursementMethod: string
{
    case Cash = 'cash';
    case Check = 'check';
    case DirectPayment = 'direct_payment';
    case GiftCard = 'gift_card';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Cash',
            self::Check => 'Check',
            self::DirectPayment => 'Direct Payment',
            self::GiftCard => 'Gift Card',
        };
    }
}
