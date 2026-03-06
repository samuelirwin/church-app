<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class EventCalendarController extends Controller
{
    /**
     * Generate an iCalendar (.ics) file for the given event.
     */
    public function __invoke(Event $event): Response
    {
        abort_unless($event->isPublished(), 404);

        $ics = $this->generateIcs($event);

        Log::info('Event calendar downloaded', [
            'event_id' => $event->id,
            'event_title' => $event->title,
        ]);

        return response($ics, 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="'.Str::slug($event->title).'.ics"',
        ]);
    }

    private function generateIcs(Event $event): string
    {
        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//ChurchApp//Events//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            'UID:event-'.$event->id.'@'.parse_url(config('app.url'), PHP_URL_HOST),
        ];

        if ($event->is_all_day) {
            $lines[] = 'DTSTART;VALUE=DATE:'.$event->starts_at->format('Ymd');
            if ($event->ends_at) {
                // iCal all-day end date is exclusive, so add one day
                $lines[] = 'DTEND;VALUE=DATE:'.$event->ends_at->addDay()->format('Ymd');
            }
        } else {
            $lines[] = 'DTSTART:'.$event->starts_at->utc()->format('Ymd\THis\Z');
            if ($event->ends_at) {
                $lines[] = 'DTEND:'.$event->ends_at->utc()->format('Ymd\THis\Z');
            }
        }

        $lines[] = 'DTSTAMP:'.now()->utc()->format('Ymd\THis\Z');
        $lines[] = 'SUMMARY:'.$this->escapeText($event->title);

        if ($event->description) {
            $lines[] = 'DESCRIPTION:'.$this->escapeText($event->description);
        }

        if ($event->location) {
            $lines[] = 'LOCATION:'.$this->escapeText($event->location);
        }

        $lines[] = 'URL:'.route('events.show', $event);
        $lines[] = 'END:VEVENT';
        $lines[] = 'END:VCALENDAR';

        return implode("\r\n", $lines)."\r\n";
    }

    /**
     * Escape special characters per RFC 5545 section 3.3.11.
     */
    private function escapeText(string $text): string
    {
        $text = str_replace('\\', '\\\\', $text);
        $text = str_replace(';', '\;', $text);
        $text = str_replace(',', '\,', $text);
        $text = str_replace("\n", '\n', $text);
        $text = str_replace("\r", '', $text);

        return $text;
    }
}
