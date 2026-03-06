<?php

namespace App\Http\Requests\Concerns;

use Mews\Purifier\Facades\Purifier;

/**
 * Sanitizes HTML fields in the request to prevent XSS attacks.
 * Classes using this trait must define a htmlFields() method
 * returning the list of field names that accept HTML content.
 */
trait SanitizesHtml
{
    /**
     * @return array<int, string>
     */
    abstract protected function htmlFields(): array;

    protected function prepareForValidation(): void
    {
        $sanitized = [];

        foreach ($this->htmlFields() as $field) {
            $value = $this->input($field);

            if (is_null($value)) {
                continue;
            }

            $clean = Purifier::clean($value);

            // Treat empty editor output as null
            if (in_array(trim($clean), ['', '<p></p>', '<p> </p>', '<p><br></p>'], true)) {
                $sanitized[$field] = null;
            } else {
                $sanitized[$field] = $clean;
            }
        }

        if ($sanitized) {
            $this->merge($sanitized);
        }
    }
}
