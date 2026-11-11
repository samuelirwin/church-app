<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceSessionRequest extends FormRequest
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
            'guest_count' => ['required', 'integer', 'min:0', 'max:100000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'guest_count.required' => 'Enter the number of guests (0 if none).',
            'guest_count.integer' => 'The guest count must be a whole number.',
            'guest_count.min' => 'The guest count cannot be negative.',
        ];
    }
}
