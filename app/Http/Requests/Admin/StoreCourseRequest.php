<?php

namespace App\Http\Requests\Admin;

use App\Enums\CourseDifficulty;
use App\Http\Requests\Concerns\SanitizesHtml;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseRequest extends FormRequest
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
            'description' => ['nullable', 'string', 'max:10000'],
            'cover_image' => ['nullable', 'image', 'max:10240', 'mimes:jpg,jpeg,png,gif,webp'],
            'remove_cover' => ['nullable', 'boolean'],
            'library_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'difficulty' => ['required', Rule::enum(CourseDifficulty::class)],
            'estimated_hours' => ['nullable', 'numeric', 'min:0.1', 'max:999'],
            'is_published' => ['nullable', 'boolean'],
            'requires_enrollment' => ['nullable', 'boolean'],
            'max_enrollments' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'The course title is required.',
            'difficulty.required' => 'Please select a difficulty level.',
        ];
    }
}
