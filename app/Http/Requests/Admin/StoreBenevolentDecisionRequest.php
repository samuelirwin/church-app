<?php

namespace App\Http\Requests\Admin;

use App\Enums\BenevolentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBenevolentDecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    BenevolentStatus::Approved->value,
                    BenevolentStatus::PartiallyApproved->value,
                    BenevolentStatus::Denied->value,
                    BenevolentStatus::Closed->value,
                ]),
            ],
            'amount_approved' => [
                'nullable',
                'numeric',
                'min:0',
                'required_if:status,approved',
                'required_if:status,partially_approved',
            ],
            'final_decision_notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.required' => 'Please select a decision.',
            'amount_approved.required_if' => 'An approved amount is required when approving a request.',
        ];
    }
}
