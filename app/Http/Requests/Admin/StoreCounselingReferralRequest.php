<?php

namespace App\Http\Requests\Admin;

use App\Enums\ReferralType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCounselingReferralRequest extends FormRequest
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
            'referred_to' => ['required', 'string', 'max:255'],
            'referral_type' => ['required', Rule::enum(ReferralType::class)],
            'referral_date' => ['required', 'date'],
            'reason' => ['required', 'string'],
            'referral_document' => ['nullable', 'file', 'max:20480', 'mimes:pdf,doc,docx,jpg,jpeg,png,gif,webp'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'referred_to.required' => 'The referral recipient is required.',
            'referral_type.required' => 'Please select a referral type.',
            'referral_date.required' => 'The referral date is required.',
            'reason.required' => 'A reason for the referral is required.',
        ];
    }
}
