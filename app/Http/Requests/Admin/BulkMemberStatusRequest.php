<?php

namespace App\Http\Requests\Admin;

use App\Enums\MembershipStatus;
use Illuminate\Validation\Rule;

class BulkMemberStatusRequest extends BulkMemberRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),
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
            ...parent::messages(),
            'membership_status.required' => 'Choose the new membership status.',
        ];
    }
}
