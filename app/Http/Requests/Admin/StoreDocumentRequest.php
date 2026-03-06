<?php

namespace App\Http\Requests\Admin;

use App\Enums\DocumentVisibility;
use App\Http\Requests\Concerns\SanitizesHtml;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequest extends FormRequest
{
    use SanitizesHtml;

    /**
     * @return array<int, string>
     */
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
        $isUpdate = $this->route('document') !== null;

        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'document_file' => [
                $isUpdate ? 'nullable' : 'required',
                'file',
                'max:20480',
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,webp',
            ],
            'thumbnail_image' => ['nullable', 'image', 'max:10240', 'mimes:jpg,jpeg,png,gif,webp'],
            'remove_thumbnail' => ['nullable', 'boolean'],
            'library_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'visibility' => ['required', Rule::enum(DocumentVisibility::class)],
            'category_id' => ['nullable', 'exists:categories,id'],
            'is_published' => ['nullable', 'boolean'],
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
            'title.required' => 'The document title is required.',
            'document_file.required' => 'A document file is required.',
            'document_file.max' => 'The document file must not exceed 20MB.',
            'document_file.mimes' => 'The file must be a PDF, Word, Excel, PowerPoint, or image file.',
            'visibility.required' => 'Please select a visibility level.',
        ];
    }
}
