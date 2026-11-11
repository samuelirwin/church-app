<?php

namespace App\Exports;

use App\Models\Member;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class MembersExport implements FromQuery, WithHeadings, WithMapping
{
    use Exportable;

    public function query(): Builder
    {
        return Member::query()->with('household')->orderBy('last_name')->orderBy('first_name');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Household', 'Date of Birth', 'Joined', 'Has Account'];
    }

    /**
     * @param  Member  $member
     * @return array<int, mixed>
     */
    public function map($member): array
    {
        return [
            $member->first_name,
            $member->last_name,
            $member->email,
            $member->phone,
            $member->membership_status->label(),
            $member->household?->name,
            $member->date_of_birth?->format('Y-m-d'),
            $member->joined_at?->format('Y-m-d'),
            $member->hasAccount() ? 'Yes' : 'No',
        ];
    }
}
