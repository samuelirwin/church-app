<?php

namespace App\Exports;

use App\Models\BookLending;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class BookLendingsExport implements FromQuery, WithHeadings, WithMapping
{
    use Exportable;

    public function query(): Builder
    {
        return BookLending::query()
            ->with(['book', 'user'])
            ->orderBy('borrowed_at', 'desc');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['Book Title', 'Borrower', 'Borrowed At', 'Due At', 'Returned At', 'Status'];
    }

    /**
     * @param  BookLending  $lending
     * @return array<int, mixed>
     */
    public function map($lending): array
    {
        return [
            $lending->book?->title,
            $lending->user?->name,
            $lending->borrowed_at?->format('Y-m-d'),
            $lending->due_at?->format('Y-m-d'),
            $lending->returned_at?->format('Y-m-d') ?? 'Not returned',
            $lending->returned_at ? 'Returned' : ($lending->due_at?->isPast() ? 'Overdue' : 'Active'),
        ];
    }
}
