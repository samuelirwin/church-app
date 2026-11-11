<?php

namespace App\Enums;

enum CareNeedType: string
{
    case Prayer = 'prayer';
    case HospitalVisit = 'hospital_visit';
    case Meals = 'meals';
    case Transportation = 'transportation';
    case Bereavement = 'bereavement';
    case NewBaby = 'new_baby';
    case HomeVisit = 'home_visit';
    case Practical = 'practical';
    case AbsenceFollowUp = 'absence_follow_up';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Prayer => 'Prayer',
            self::HospitalVisit => 'Hospital Visit',
            self::Meals => 'Meals',
            self::Transportation => 'Transportation',
            self::Bereavement => 'Bereavement',
            self::NewBaby => 'New Baby',
            self::HomeVisit => 'Home Visit',
            self::Practical => 'Practical Help',
            self::AbsenceFollowUp => 'Absence Follow-up',
            self::Other => 'Other',
        };
    }

    /**
     * Types a member can choose when asking for help themselves.
     *
     * @return list<self>
     */
    public static function requestable(): array
    {
        return array_values(array_filter(self::cases(), fn (self $type) => $type !== self::AbsenceFollowUp));
    }
}
