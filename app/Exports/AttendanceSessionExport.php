<?php

namespace App\Exports;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class AttendanceSessionExport implements FromQuery, WithHeadings, WithMapping
{
    use Exportable;

    public function __construct(private AttendanceSession $session) {}

    public function query(): Builder
    {
        return AttendanceRecord::query()
            ->where('attendance_session_id', $this->session->id)
            ->with('member')
            ->orderBy('checked_in_at');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['Name', 'Status', 'Method', 'Checked In At'];
    }

    /**
     * @param  AttendanceRecord  $record
     * @return array<int, mixed>
     */
    public function map($record): array
    {
        return [
            $record->member?->full_name,
            $record->status->label(),
            $record->check_in_method->label(),
            $record->checked_in_at?->format('Y-m-d H:i'),
        ];
    }
}
