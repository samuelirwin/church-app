<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Concerns\SanitizesHtml;
use Illuminate\Foundation\Http\FormRequest;

class StoreBookRequest extends FormRequest
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
            'author' => ['required', 'string', 'max:255'],
            'isbn' => ['nullable', 'string', 'max:20'],
            'publisher' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'cover_image' => ['nullable', 'image', 'max:10240', 'mimes:jpg,jpeg,png,gif,webp'],
            'remove_cover' => ['nullable', 'boolean'],
            'library_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'total_copies' => ['nullable', 'integer', 'min:0'],
            'available_copies' => ['nullable', 'integer', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'The book title is required.',
            'author.required' => 'The book author is required.',
        ];
    }
}
