<?php

namespace App\Enums;

enum CategoryType: string
{
    case Sermon = 'sermon';
    case Post = 'post';
    case Media = 'media';
    case Book = 'book';
    case Academy = 'academy';
    case Event = 'event';
    case Document = 'document';
    case Page = 'page';

    public function label(): string
    {
        return match ($this) {
            self::Sermon => 'Sermon',
            self::Post => 'Post',
            self::Media => 'Media',
            self::Book => 'Book',
            self::Academy => 'Academy',
            self::Event => 'Event',
            self::Document => 'Document',
            self::Page => 'Page',
        };
    }
}
