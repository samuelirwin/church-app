<?php

namespace App\Http\Requests\Admin;

use App\Enums\CaseStatus;
use App\Enums\CaseType;
use App\Http\Requests\Concerns\SanitizesHtml;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCounselingCaseRequest extends FormRequest
{
    use SanitizesHtml;

    /**
     * @return array<int, string>
     */
    protected function htmlFields(): array
    {
        return ['presenting_issue'];
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
        $isUpdate = $this->route('counselingCase') !== null;

        $rules = [
            'person_name' => ['required', 'string', 'max:255'],
            'person_contact' => ['nullable', 'string', 'max:255'],
            'person_email' => ['nullable', 'email', 'max:255'],
            'case_type' => ['required', Rule::enum(CaseType::class)],
            'presenting_issue' => ['required', 'string'],
            'background_notes' => ['nullable', 'string'],
            'referral_source' => ['nullable', 'string', 'max:255'],
            'assigned_counselor_id' => ['nullable', 'exists:users,id'],
        ];

        if ($isUpdate) {
            $rules['status'] = ['required', Rule::enum(CaseStatus::class)];
            $rules['closure_reason'] = ['nullable', 'string', 'max:5000'];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'person_name.required' => 'The person name is required.',
            'case_type.required' => 'Please select a case type.',
            'presenting_issue.required' => 'The presenting issue is required.',
        ];
    }
}
