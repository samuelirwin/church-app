<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreVolunteerScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isStaffOrAbove();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'volunteer_role_id' => ['required', 'exists:volunteer_roles,id'],
            'user_id' => ['required', 'exists:users,id'],
            'scheduled_date' => ['required', 'date'],
            'service_time_id' => ['required', 'exists:service_times,id'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'volunteer_role_id.required' => 'Please select a volunteer role.',
            'user_id.required' => 'Please select a volunteer.',
            'scheduled_date.required' => 'The scheduled date is required.',
            'service_time_id.required' => 'Please select a service time.',
        ];
    }
}
