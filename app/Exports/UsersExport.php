<?php

namespace App\Exports;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class UsersExport implements FromQuery, WithHeadings, WithMapping
{
    use Exportable;

    public function query(): Builder
    {
        return User::query()->orderBy('name');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['Name', 'Email', 'Role', 'Joined'];
    }

    /**
     * @param  User  $user
     * @return array<int, mixed>
     */
    public function map($user): array
    {
        return [
            $user->name,
            $user->email,
            $user->role->value,
            $user->created_at?->format('Y-m-d'),
        ];
    }
}
