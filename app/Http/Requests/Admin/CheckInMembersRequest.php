<?php

namespace App\Http\Requests\Admin;

use App\Enums\AttendanceStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckInMembersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->route('attendanceSession')->canBeManagedBy($this->user());
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'member_ids' => ['required', 'array', 'min:1', 'max:500'],
            'member_ids.*' => ['integer', 'distinct', Rule::exists('members', 'id')->whereNull('deleted_at')],
            'status' => ['nullable', Rule::enum(AttendanceStatus::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'member_ids.required' => 'Choose at least one person to check in.',
            'member_ids.*.exists' => 'One of the selected people is not in the directory.',
        ];
    }
}
