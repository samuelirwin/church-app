<?php

namespace App\Http\Requests\Admin;

use App\Enums\CareNeedPriority;
use App\Enums\CareNeedStatus;
use App\Enums\CareNeedType;
use App\Enums\UserRole;
use App\Models\Member;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Shared by create and update. Leaders can only raise needs for people
 * they can see in the directory.
 */
class StoreCareNeedRequest extends FormRequest
{
    public function authorize(): bool
    {
        $careNeed = $this->route('careNeed');

        if ($careNeed) {
            return $careNeed->isVisibleTo($this->user());
        }

        return $this->user()->isLeaderOrAbove();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'member_id' => ['nullable', 'required_without:requester_name', 'integer', Rule::exists('members', 'id')->whereNull('deleted_at')],
            'requester_name' => ['nullable', 'required_without:member_id', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => ['required', Rule::enum(CareNeedType::class)],
            'priority' => ['required', Rule::enum(CareNeedPriority::class)],
            'status' => ['sometimes', Rule::enum(CareNeedStatus::class)],
            'is_confidential' => ['boolean'],
            'share_on_prayer_wall' => ['boolean'],
            'assigned_to' => ['nullable', 'integer', Rule::exists('users', 'id')->whereIn('role', [UserRole::Admin->value, UserRole::Staff->value, UserRole::Leader->value])],
            'due_on' => ['nullable', 'date'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $memberId = $this->input('member_id');

            if ($memberId && ! $this->user()->isStaffOrAbove()
                && ! Member::query()->visibleTo($this->user())->whereKey($memberId)->exists()) {
                $validator->errors()->add('member_id', 'You can only add care needs for people in your ministries or groups.');
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'member_id.required_without' => 'Choose a person from the directory or type their name.',
            'requester_name.required_without' => 'Choose a person from the directory or type their name.',
            'title.required' => 'Give the need a short title.',
            'type.required' => 'Choose the type of need.',
            'priority.required' => 'Choose a priority.',
            'assigned_to.exists' => 'Care needs can only be assigned to leaders or staff.',
        ];
    }
}
