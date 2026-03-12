<?php

namespace App\Exports;

use App\Models\Form;
use App\Models\FormResponse;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class FormResponsesExport implements FromQuery, WithHeadings, WithMapping
{
    use Exportable;

    /** @var array<int, array<string, mixed>> */
    private array $fields;

    public function __construct(
        private Form $form
    ) {
        $this->fields = $form->fields ?? [];
    }

    public function query(): Builder
    {
        return FormResponse::query()
            ->where('form_id', $this->form->id)
            ->with('user')
            ->orderBy('submitted_at');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        $headings = ['Submitted By', 'Submitted At', 'Score'];

        foreach ($this->fields as $field) {
            $headings[] = $field['label'] ?? $field['id'];
        }

        return $headings;
    }

    /**
     * @param  FormResponse  $response
     * @return array<int, mixed>
     */
    public function map($response): array
    {
        $row = [
            $response->user?->name ?? 'Anonymous',
            $response->submitted_at?->format('Y-m-d H:i'),
            $response->score,
        ];

        foreach ($this->fields as $field) {
            $answer = $response->answers[$field['id']] ?? '';
            $row[] = is_array($answer) ? implode(', ', $answer) : $answer;
        }

        return $row;
    }
}
