<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizQuestionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'question' => $this->question,
            'type' => $this->type?->value,
            'type_label' => $this->type?->label(),
            'options' => $this->options,
            'points' => $this->points,
            'sort_order' => $this->sort_order,
            'explanation' => $this->explanation,
            // Only include correct_answer for admin context
            'correct_answer' => $this->when($request->routeIs('admin.*'), $this->correct_answer),
        ];
    }
}
