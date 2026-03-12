<?php

namespace App\Exports;

use App\Models\Visitor;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class VisitorsExport implements FromQuery, WithHeadings, WithMapping
{
    use Exportable;

    public function query(): Builder
    {
        return Visitor::query()->orderBy('created_at', 'desc');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['Name', 'Email', 'Phone', 'Visit Date', 'Converted'];
    }

    /**
     * @param  Visitor  $visitor
     * @return array<int, mixed>
     */
    public function map($visitor): array
    {
        return [
            $visitor->name,
            $visitor->email,
            $visitor->phone,
            $visitor->created_at?->format('Y-m-d'),
            $visitor->converted_to_user_id ? 'Yes' : 'No',
        ];
    }
}
