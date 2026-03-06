<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSiteSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'church_name' => ['required', 'string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:500'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'hero_tagline' => ['nullable', 'string', 'max:255'],
            'hero_heading' => ['nullable', 'string', 'max:255'],
            'hero_subheading' => ['nullable', 'string', 'max:500'],
            'social_links' => ['nullable', 'array'],
            'social_links.*.platform' => ['required', 'string', 'max:100'],
            'social_links.*.url' => ['required', 'url', 'max:500'],
            'social_links.*.icon' => ['required', 'string', 'max:50'],
            'social_links.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'logo_image' => ['nullable', 'image', 'mimes:jpeg,png,gif,webp,svg', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'church_name.required' => 'The church name is required.',
            'email.email' => 'Please enter a valid email address.',
            'social_links.*.platform.required' => 'Each social link must have a platform name.',
            'social_links.*.url.required' => 'Each social link must have a URL.',
            'social_links.*.url.url' => 'Each social link URL must be a valid URL.',
            'social_links.*.icon.required' => 'Each social link must have an icon.',
            'logo_image.image' => 'The logo must be an image file.',
            'logo_image.mimes' => 'The logo must be a JPEG, PNG, GIF, WebP, or SVG file.',
            'logo_image.max' => 'The logo must not be larger than 2MB.',
        ];
    }
}
