<?php

namespace App\Http\Requests\Admin;

use App\Enums\MembershipStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChangeMemberStatusRequest extends FormRequest
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
            'membership_status' => ['required', Rule::enum(MembershipStatus::class)],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'membership_status.required' => 'Choose the new membership status.',
        ];
    }
}
