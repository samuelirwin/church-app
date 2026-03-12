<?php

namespace App\Exports;

use App\Models\BenevolentRequest;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class BenevolentRequestsExport implements FromQuery, WithHeadings, WithMapping
{
    use Exportable;

    public function query(): Builder
    {
        return BenevolentRequest::query()
            ->with('creator')
            ->orderBy('created_at', 'desc');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return [
            'Requester Name', 'Category', 'Urgency', 'Status',
            'Amount Requested', 'Amount Approved', 'Created By', 'Created At',
        ];
    }

    /**
     * @param  BenevolentRequest  $request
     * @return array<int, mixed>
     */
    public function map($request): array
    {
        return [
            $request->requester_name,
            $request->category->label(),
            $request->urgency->label(),
            $request->status->label(),
            $request->amount_requested,
            $request->amount_approved,
            $request->creator?->name,
            $request->created_at?->format('Y-m-d'),
        ];
    }
}
