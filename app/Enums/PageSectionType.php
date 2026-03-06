<?php

namespace App\Enums;

enum PageSectionType: string
{
    case RichText = 'rich_text';
    case FormEmbed = 'form_embed';
    case Image = 'image';
    case CallToAction = 'call_to_action';
    case VideoEmbed = 'video_embed';
    case QrCode = 'qr_code';

    public function label(): string
    {
        return match ($this) {
            self::RichText => 'Rich Text',
            self::FormEmbed => 'Form Embed',
            self::Image => 'Image',
            self::CallToAction => 'Call to Action',
            self::VideoEmbed => 'Video Embed',
            self::QrCode => 'QR Code',
        };
    }
}
