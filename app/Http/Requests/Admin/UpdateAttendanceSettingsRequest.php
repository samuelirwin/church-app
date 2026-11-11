<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceSettingsRequest extends FormRequest
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
            'absence_threshold' => ['required', 'integer', 'min:1', 'max:12'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'absence_threshold.required' => 'Enter how many missed services trigger an alert.',
            'absence_threshold.min' => 'The threshold must be at least 1 service.',
            'absence_threshold.max' => 'The threshold cannot be more than 12 services.',
        ];
    }
}
