<?php

namespace App\Enums;

enum LessonContentType: string
{
    case Video = 'video';
    case Text = 'text';
    case Mixed = 'mixed';

    public function label(): string
    {
        return match ($this) {
            self::Video => 'Video',
            self::Text => 'Text',
            self::Mixed => 'Mixed',
        };
    }
}
