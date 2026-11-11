<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AssignCareNeedTaskRequest extends FormRequest
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
            'volunteer_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'volunteer_id.exists' => 'The selected volunteer does not exist.',
        ];
    }
}
