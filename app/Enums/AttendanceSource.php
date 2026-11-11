<?php

namespace App\Enums;

use App\Models\Event;
use App\Models\MinistryGroup;
use App\Models\ServiceTime;
use Illuminate\Database\Eloquent\Model;

/**
 * What an attendance session is for. Maps the short value used in forms and
 * URLs to the model class stored in the polymorphic attendable_type column.
 */
enum AttendanceSource: string
{
    case Service = 'service';
    case Event = 'event';
    case Group = 'group';

    public function label(): string
    {
        return match ($this) {
            self::Service => 'Service',
            self::Event => 'Event',
            self::Group => 'Group',
        };
    }

    /**
     * @return class-string<Model>
     */
    public function modelClass(): string
    {
        return match ($this) {
            self::Service => ServiceTime::class,
            self::Event => Event::class,
            self::Group => MinistryGroup::class,
        };
    }

    public static function fromModelClass(string $class): self
    {
        foreach (self::cases() as $case) {
            if ($case->modelClass() === $class) {
                return $case;
            }
        }

        throw new \InvalidArgumentException("No attendance source for [{$class}].");
    }
}
