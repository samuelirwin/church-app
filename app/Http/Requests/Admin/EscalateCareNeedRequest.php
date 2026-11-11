<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class EscalateCareNeedRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isStaffOrAbove() && $this->route('careNeed')->isVisibleTo($this->user());
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'target' => ['required', 'in:benevolence,counseling'],
            'amount_requested' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'target.required' => 'Choose where to escalate this need.',
            'target.in' => 'Needs can be escalated to Benevolence or Counseling.',
            'amount_requested.numeric' => 'The amount must be a number.',
            'amount_requested.min' => 'The amount cannot be negative.',
        ];
    }
}
