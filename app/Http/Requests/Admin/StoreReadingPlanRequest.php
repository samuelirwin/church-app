<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Concerns\SanitizesHtml;
use Illuminate\Foundation\Http\FormRequest;

class StoreReadingPlanRequest extends FormRequest
{
    use SanitizesHtml;

    protected function htmlFields(): array
    {
        return ['description'];
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
            'description' => ['nullable', 'string', 'max:5000'],
            'cover_image' => ['nullable', 'image', 'max:10240', 'mimes:jpg,jpeg,png,gif,webp'],
            'remove_cover' => ['nullable', 'boolean'],
            'library_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'duration_days' => ['required', 'integer', 'min:1', 'max:365'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'The plan title is required.',
            'duration_days.required' => 'The number of days is required.',
            'duration_days.min' => 'The plan must have at least 1 day.',
        ];
    }
}
