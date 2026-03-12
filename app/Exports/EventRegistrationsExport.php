<?php

namespace App\Exports;

use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class EventRegistrationsExport implements FromQuery, WithHeadings, WithMapping
{
    use Exportable;

    public function __construct(
        private Event $event
    ) {}

    public function query(): Builder
    {
        return EventRegistration::query()
            ->where('event_id', $this->event->id)
            ->orderBy('registered_at');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['Name', 'Email', 'Phone', 'Status', 'Registered At'];
    }

    /**
     * @param  EventRegistration  $registration
     * @return array<int, mixed>
     */
    public function map($registration): array
    {
        return [
            $registration->name,
            $registration->email,
            $registration->phone,
            $registration->status->value,
            $registration->registered_at?->format('Y-m-d H:i'),
        ];
    }
}
