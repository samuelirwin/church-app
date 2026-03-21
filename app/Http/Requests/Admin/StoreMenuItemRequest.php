<?php

namespace App\Http\Requests\Admin;

use App\Enums\MenuItemTarget;
use App\Enums\MenuItemType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMenuItemRequest extends FormRequest
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
            'label' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(MenuItemType::class)],
            'url' => ['nullable', 'required_if:type,custom_url', 'url', 'max:2048'],
            'route' => ['nullable', 'required_if:type,internal_page', 'string', 'max:255'],
            'target' => ['required', Rule::enum(MenuItemTarget::class)],
            'parent_id' => ['nullable', 'integer', 'exists:menu_items,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'page_id' => ['nullable', 'required_if:type,page', 'integer', 'exists:pages,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'label.required' => 'The menu label is required.',
            'url.required_if' => 'A URL is required for custom URL items.',
            'url.url' => 'The URL must be a valid web address.',
            'route.required_if' => 'An internal page must be selected.',
            'parent_id.exists' => 'The selected parent menu item does not exist.',
            'page_id.required_if' => 'A page must be selected for page type items.',
            'page_id.exists' => 'The selected page does not exist.',
        ];
    }
}
