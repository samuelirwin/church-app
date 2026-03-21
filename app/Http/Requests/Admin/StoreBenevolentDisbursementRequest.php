<?php

namespace App\Http\Requests\Admin;

use App\Enums\DisbursementMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBenevolentDisbursementRequest extends FormRequest
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
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', Rule::enum(DisbursementMethod::class)],
            'reference_number' => ['nullable', 'string', 'max:255'],
            'disbursed_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'amount.required' => 'The disbursement amount is required.',
            'amount.min' => 'The disbursement amount must be at least $0.01.',
            'method.required' => 'Please select a disbursement method.',
            'disbursed_at.required' => 'The disbursement date is required.',
        ];
    }
}
