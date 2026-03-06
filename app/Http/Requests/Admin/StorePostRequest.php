<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Concerns\SanitizesHtml;
use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    use SanitizesHtml;

    protected function htmlFields(): array
    {
        return ['excerpt', 'body'];
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
            'excerpt' => ['nullable', 'string', 'max:2000'],
            'body' => ['required', 'string'],
            'cover_image' => ['nullable', 'image', 'max:10240', 'mimes:jpg,jpeg,png,gif,webp'],
            'remove_cover' => ['nullable', 'boolean'],
            'library_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'is_featured' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'The post title is required.',
            'body.required' => 'The post body is required.',
            'category_id.exists' => 'The selected category does not exist.',
        ];
    }
}
