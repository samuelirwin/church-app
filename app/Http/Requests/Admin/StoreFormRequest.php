<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Concerns\SanitizesHtml;
use Illuminate\Foundation\Http\FormRequest;

class StoreFormRequest extends FormRequest
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
            'description' => ['nullable', 'string'],
            'fields' => ['required', 'array', 'min:1'],
            'fields.*.id' => ['required', 'string'],
            'fields.*.type' => ['required', 'string', 'in:text,textarea,select,checkbox,radio,date,file,number,email,rating,scale'],
            'fields.*.label' => ['required', 'string', 'max:255'],
            'fields.*.placeholder' => ['nullable', 'string', 'max:255'],
            'fields.*.required' => ['nullable', 'boolean'],
            'fields.*.options' => ['nullable', 'array'],
            'fields.*.options.*.label' => ['required_with:fields.*.options', 'string'],
            'fields.*.options.*.value' => ['required_with:fields.*.options', 'string'],
            'fields.*.points' => ['nullable', 'integer', 'min:0'],
            'fields.*.step' => ['nullable', 'integer', 'min:1'],
            'settings' => ['nullable', 'array'],
            'settings.confirmation_message' => ['nullable', 'string', 'max:500'],
            'settings.redirect_url' => ['nullable', 'url', 'max:500'],
            'settings.scoring_enabled' => ['nullable', 'boolean'],
            'settings.show_results' => ['nullable', 'boolean'],
            'settings.one_response_per_user' => ['nullable', 'boolean'],
            'is_multi_step' => ['nullable', 'boolean'],
            'is_published' => ['nullable', 'boolean'],
            'allows_anonymous' => ['nullable', 'boolean'],
            'expires_at' => ['nullable', 'date'],
            'max_responses' => ['nullable', 'integer', 'min:1'],
            'notification_emails' => ['nullable', 'array'],
            'notification_emails.*' => ['email'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'The form title is required.',
            'fields.required' => 'At least one field is required.',
            'fields.min' => 'At least one field is required.',
            'fields.*.type.in' => 'Invalid field type selected.',
            'fields.*.label.required' => 'Each field must have a label.',
        ];
    }
}
