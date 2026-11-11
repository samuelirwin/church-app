<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A set of members picked in the directory for a bulk action. Staff and above only.
 */
class BulkMemberRequest extends FormRequest
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
            'member_ids' => ['required', 'array', 'min:1', 'max:200'],
            'member_ids.*' => ['integer', 'distinct', Rule::exists('members', 'id')->whereNull('deleted_at')],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'member_ids.required' => 'Select at least one member.',
            'member_ids.max' => 'You can update up to 200 members at a time.',
            'member_ids.*.exists' => 'One of the selected members no longer exists.',
        ];
    }
}
