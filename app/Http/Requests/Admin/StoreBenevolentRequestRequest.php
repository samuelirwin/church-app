<?php

namespace App\Http\Requests\Admin;

use App\Enums\BenevolentCategory;
use App\Enums\BenevolentUrgency;
use App\Http\Requests\Concerns\SanitizesHtml;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBenevolentRequestRequest extends FormRequest
{
    use SanitizesHtml;

    /**
     * @return array<int, string>
     */
    protected function htmlFields(): array
    {
        return ['description'];
    }

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
            'requester_name' => ['required', 'string', 'max:255'],
            'requester_contact' => ['nullable', 'string', 'max:255'],
            'category' => ['required', Rule::enum(BenevolentCategory::class)],
            'description' => ['required', 'string'],
            'amount_requested' => ['nullable', 'numeric', 'min:0'],
            'urgency' => ['required', Rule::enum(BenevolentUrgency::class)],
            'evidence' => ['nullable', 'array', 'max:10'],
            'evidence.*' => ['file', 'max:20480', 'mimes:pdf,doc,docx,jpg,jpeg,png,gif,webp'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'requester_name.required' => 'The requester name is required.',
            'category.required' => 'Please select a category.',
            'description.required' => 'A description of the request is required.',
            'urgency.required' => 'Please select an urgency level.',
            'evidence.max' => 'You may upload a maximum of 10 files.',
            'evidence.*.max' => 'Each file must not exceed 20MB.',
            'evidence.*.mimes' => 'Files must be PDF, Word documents, or images.',
        ];
    }
}
