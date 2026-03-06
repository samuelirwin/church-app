<?php

namespace App\Http\Requests\Admin;

use App\Enums\HighlightType;
use App\Http\Requests\Concerns\SanitizesHtml;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreHighlightRequest extends FormRequest
{
    use SanitizesHtml;

    protected function htmlFields(): array
    {
        return ['body'];
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->isStaffOrAbove();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'cover_image' => ['nullable', 'image', 'max:10240', 'mimes:jpg,jpeg,png,gif,webp'],
            'remove_cover' => ['nullable', 'boolean'],
            'library_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'type' => ['required', Rule::enum(HighlightType::class)],
            'priority' => ['required', 'integer', 'min:1', 'max:10'],
            'is_active' => ['nullable', 'boolean'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'The highlight title is required.',
            'body.required' => 'The highlight body is required.',
            'type.required' => 'The highlight type is required.',
            'priority.required' => 'The priority is required.',
            'priority.min' => 'Priority must be between 1 and 10.',
            'priority.max' => 'Priority must be between 1 and 10.',
            'starts_at.required' => 'The start date is required.',
            'ends_at.after_or_equal' => 'The end date must be on or after the start date.',
        ];
    }
}
