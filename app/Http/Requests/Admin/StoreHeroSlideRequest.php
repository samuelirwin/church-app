<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreHeroSlideRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Image is required on create unless a library media ID is provided
        $imageRequired = $this->isMethod('POST') && ! $this->input('library_media_id');
        $imageRule = $imageRequired ? 'required' : 'nullable';

        return [
            'image' => [$imageRule, 'image', 'max:5120', 'mimes:jpeg,png,gif,webp'],
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'link_url' => ['nullable', 'url', 'max:500'],
            'link_text' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
            'remove_image' => ['nullable', 'boolean'],
            'library_media_id' => ['nullable', 'integer', 'exists:media,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'image.required' => 'A hero image is required.',
            'image.image' => 'The file must be an image.',
            'image.max' => 'The image must not exceed 5MB.',
            'image.mimes' => 'The image must be a JPEG, PNG, GIF, or WebP file.',
            'link_url.url' => 'The link URL must be a valid URL.',
            'title.max' => 'The title must not exceed 255 characters.',
            'subtitle.max' => 'The subtitle must not exceed 500 characters.',
            'link_text.max' => 'The link text must not exceed 100 characters.',
        ];
    }
}
