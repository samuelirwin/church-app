<?php

namespace App\Http\Requests\Member;

use App\Models\Member;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A signed-in person may check in themselves and anyone in their household.
 */
class SelfCheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'member_ids' => ['required', 'array', 'min:1'],
            'member_ids.*' => ['integer', 'distinct', Rule::in($this->allowedMemberIds())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'member_ids.required' => 'Choose at least one person to check in.',
            'member_ids.*.in' => 'You can only check in yourself and your household.',
        ];
    }

    /**
     * @return array<int, int>
     */
    public function allowedMemberIds(): array
    {
        $member = $this->user()->member;

        if (! $member) {
            return [];
        }

        if (! $member->household_id) {
            return [$member->id];
        }

        return Member::query()->where('household_id', $member->household_id)->pluck('id')->all();
    }
}
