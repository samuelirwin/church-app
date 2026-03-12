<?php

namespace App\Exports;

use App\Models\CounselingCase;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class CounselingCasesExport implements FromQuery, WithHeadings, WithMapping
{
    use Exportable;

    public function query(): Builder
    {
        return CounselingCase::query()
            ->withCount('sessions')
            ->orderBy('created_at', 'desc');
    }

    /**
     * Redacted export — no personal details, only case metadata.
     *
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['Case Number', 'Type', 'Status', 'Sessions Count', 'Created At'];
    }

    /**
     * @param  CounselingCase  $case
     * @return array<int, mixed>
     */
    public function map($case): array
    {
        return [
            $case->case_number,
            $case->case_type->label(),
            $case->status->label(),
            $case->sessions_count,
            $case->created_at?->format('Y-m-d'),
        ];
    }
}
