<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Concerns\SanitizesHtml;
use Illuminate\Foundation\Http\FormRequest;

class StoreSermonRequest extends FormRequest
{
    use SanitizesHtml;

    protected function htmlFields(): array
    {
        return ['description', 'notes'];
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
            'notes' => ['nullable', 'string'],
            'scripture_references' => ['nullable', 'array'],
            'scripture_references.*' => ['string', 'max:255'],
            'sermon_date' => ['required', 'date'],
            'video_url' => ['nullable', 'url', 'max:2048'],
            'cover_image' => ['nullable', 'image', 'max:10240', 'mimes:jpg,jpeg,png,gif,webp'],
            'remove_cover' => ['nullable', 'boolean'],
            'library_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'speaker_id' => ['required', 'exists:speakers,id'],
            'series_id' => ['nullable', 'exists:sermon_series,id'],
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
            'title.required' => 'The sermon title is required.',
            'sermon_date.required' => 'The sermon date is required.',
            'speaker_id.required' => 'A speaker must be selected.',
            'speaker_id.exists' => 'The selected speaker does not exist.',
            'video_url.url' => 'The video URL must be a valid URL.',
        ];
    }
}
