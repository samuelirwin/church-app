<?php

namespace App\Http\Requests\Admin;

use App\Enums\PageLayout;
use App\Enums\PageSectionType;
use App\Enums\SectionAlignment;
use App\Http\Requests\Concerns\SanitizesHtml;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Mews\Purifier\Facades\Purifier;

class StorePageRequest extends FormRequest
{
    use SanitizesHtml;

    protected function htmlFields(): array
    {
        return ['description'];
    }

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
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'redirect_url' => ['nullable', 'url:http,https', 'max:2048'],
            'layout' => ['required', Rule::enum(PageLayout::class)],
            'sections' => ['nullable', 'array'],
            'sections.*.id' => ['required', 'string'],
            'sections.*.type' => ['required', Rule::enum(PageSectionType::class)],
            'sections.*.alignment' => ['required', Rule::enum(SectionAlignment::class)],
            'sections.*.data' => ['required', 'array'],
            'sections.*.data.content' => ['nullable', 'string'],
            'sections.*.data.form_id' => ['nullable', 'integer', 'exists:forms,id'],
            'sections.*.data.heading' => ['nullable', 'string', 'max:255'],
            'sections.*.data.body' => ['nullable', 'string'],
            'sections.*.data.button_label' => ['nullable', 'string', 'max:255'],
            'sections.*.data.button_url' => ['nullable', 'string', 'max:2048'],
            'sections.*.data.url' => ['nullable', 'string', 'max:2048'],
            'sections.*.data.alt_text' => ['nullable', 'string', 'max:255'],
            'sections.*.data.caption' => ['nullable', 'string', 'max:500'],
            'sections.*.data.url_mode' => ['nullable', 'string', 'in:page,custom'],
            'sections.*.data.custom_url' => ['nullable', 'url:http,https', 'max:2048'],
            'is_published' => ['nullable', 'boolean'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:255'],
            'cover_images' => ['nullable', 'array'],
            'cover_images.*' => ['image', 'max:5120'],
            'section_images' => ['nullable', 'array'],
            'section_images.*' => ['image', 'max:5120'],
            'remove_covers' => ['nullable', 'array'],
            'remove_covers.*' => ['integer'],
            'library_media_ids' => ['nullable', 'array'],
            'library_media_ids.*' => ['integer', 'exists:media,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'The page title is required.',
            'layout.required' => 'A page layout must be selected.',
            'sections.*.type.required' => 'Each section must have a type.',
            'sections.*.data.required' => 'Each section must have data.',
            'sections.*.data.form_id.exists' => 'The selected form does not exist.',
            'redirect_url.url' => 'The redirect URL must be a valid URL (http or https).',
            'cover_images.*.image' => 'Cover images must be valid image files.',
            'cover_images.*.max' => 'Cover images must be 5MB or less.',
        ];
    }

    /**
     * Sanitize HTML content within sections after standard field sanitization.
     */
    protected function passedValidation(): void
    {
        $sections = $this->input('sections', []);

        if (! is_array($sections)) {
            return;
        }

        $htmlSectionTypes = [
            PageSectionType::RichText->value,
            PageSectionType::CallToAction->value,
        ];

        foreach ($sections as $index => &$section) {
            if (! in_array($section['type'] ?? '', $htmlSectionTypes, true)) {
                continue;
            }

            if (isset($section['data']['content'])) {
                $section['data']['content'] = Purifier::clean($section['data']['content']);
            }

            if (isset($section['data']['body'])) {
                $section['data']['body'] = Purifier::clean($section['data']['body']);
            }
        }

        $this->merge(['sections' => $sections]);
    }
}
