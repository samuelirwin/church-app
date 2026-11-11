<?php

namespace App\Http\Requests\Admin;

use App\Enums\Gender;
use App\Enums\HouseholdRole;
use App\Enums\MaritalStatus;
use App\Enums\MembershipStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Shared by create and update. On update the current member is ignored by
 * the unique email rule so saving without changing the email still passes.
 */
class StoreMemberRequest extends FormRequest
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
        $memberId = $this->route('member')?->id;

        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'preferred_name' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('members', 'email')->ignore($memberId)->whereNull('deleted_at')],
            'phone' => ['nullable', 'string', 'max:30'],
            'date_of_birth' => ['nullable', 'date', 'before_or_equal:today'],
            'gender' => ['nullable', Rule::enum(Gender::class)],
            'marital_status' => ['nullable', Rule::enum(MaritalStatus::class)],
            'household_id' => ['nullable', 'integer', 'exists:households,id'],
            'household_role' => ['nullable', 'required_with:household_id', Rule::enum(HouseholdRole::class)],
            'address_line_1' => ['nullable', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'membership_status' => [$memberId ? 'sometimes' : 'required', Rule::enum(MembershipStatus::class)],
            'joined_at' => ['nullable', 'date'],
            'baptized_at' => ['nullable', 'date', 'before_or_equal:today'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'photo' => ['nullable', 'image', 'max:5120', 'mimes:jpg,jpeg,png,gif,webp'],
            'remove_photo' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'first_name.required' => 'The first name is required.',
            'email.unique' => 'Another member already uses this email address.',
            'date_of_birth.before_or_equal' => 'The date of birth cannot be in the future.',
            'baptized_at.before_or_equal' => 'The baptism date cannot be in the future.',
            'household_id.exists' => 'The selected household does not exist.',
            'household_role.required_with' => 'Choose this person\'s role in the household.',
            'membership_status.required' => 'Choose a membership status.',
            'photo.max' => 'The photo must be 5MB or smaller.',
        ];
    }
}
