<?php

namespace App\Http\Requests\Member;

use App\Enums\CareNeedType;
use App\Models\Member;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A member asking for care for themselves or someone in their household.
 */
class StoreMyCareNeedRequest extends FormRequest
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
            'member_id' => ['nullable', 'integer', Rule::in($this->householdMemberIds())],
            'type' => ['required', Rule::in(array_map(fn (CareNeedType $t) => $t->value, CareNeedType::requestable()))],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_confidential' => ['boolean'],
            'share_on_prayer_wall' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'member_id.in' => 'You can only ask for help for yourself or your household.',
            'type.required' => 'Choose what kind of help you need.',
            'type.in' => 'Choose what kind of help you need.',
            'title.required' => 'Give your request a short title.',
        ];
    }

    /**
     * @return array<int, int>
     */
    public function householdMemberIds(): array
    {
        $member = $this->user()->member;

        if (! $member) {
            return [];
        }

        return $member->household_id
            ? Member::query()->where('household_id', $member->household_id)->pluck('id')->all()
            : [$member->id];
    }
}
