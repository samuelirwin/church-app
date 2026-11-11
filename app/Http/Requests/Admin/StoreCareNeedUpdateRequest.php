<?php

namespace App\Http\Requests\Admin;

use App\Enums\CareNeedStatus;
use App\Enums\ContactMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCareNeedUpdateRequest extends FormRequest
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
            'body' => ['required', 'string', 'max:5000'],
            'contact_method' => ['required', Rule::enum(ContactMethod::class)],
            'status' => ['nullable', Rule::enum(CareNeedStatus::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'body.required' => 'Write a short note about what happened.',
            'contact_method.required' => 'Choose how you were in touch.',
        ];
    }
}
