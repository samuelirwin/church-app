<?php

namespace App\Http\Requests\Admin;

use App\Enums\HouseholdRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreHouseholdMemberRequest extends FormRequest
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
            'member_id' => ['required', 'integer', Rule::exists('members', 'id')->whereNull('deleted_at')],
            'household_role' => ['required', Rule::enum(HouseholdRole::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'member_id.required' => 'Choose a member to add.',
            'member_id.exists' => 'The selected member does not exist.',
            'household_role.required' => 'Choose this person\'s role in the household.',
        ];
    }
}
