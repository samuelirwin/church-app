<?php

namespace App\Enums;

enum CareNeedPriority: string
{
    case Low = 'low';
    case Normal = 'normal';
    case High = 'high';
    case Urgent = 'urgent';

    public function label(): string
    {
        return match ($this) {
            self::Low => 'Low',
            self::Normal => 'Normal',
            self::High => 'High',
            self::Urgent => 'Urgent',
        };
    }

    /**
     * Matching Benevolence urgency, used when a need is escalated there.
     */
    public function benevolentUrgency(): BenevolentUrgency
    {
        return match ($this) {
            self::Low => BenevolentUrgency::Low,
            self::Normal => BenevolentUrgency::Medium,
            self::High => BenevolentUrgency::High,
            self::Urgent => BenevolentUrgency::Critical,
        };
    }
}
