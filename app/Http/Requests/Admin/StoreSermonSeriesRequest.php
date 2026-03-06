<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Concerns\SanitizesHtml;
use Illuminate\Foundation\Http\FormRequest;

class StoreSermonSeriesRequest extends FormRequest
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
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'The series title is required.',
            'end_date.after_or_equal' => 'The end date must be on or after the start date.',
        ];
    }
}
