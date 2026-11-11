<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreCareNeedTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->route('careNeed')->isVisibleTo($this->user());
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'description' => ['required', 'string', 'max:255'],
            'due_on' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'description.required' => 'Describe what needs doing, e.g. "Dinner on Tuesday".',
        ];
    }
}
