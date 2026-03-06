<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LessonResource extends JsonResource
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
            'title' => $this->title,
            'slug' => $this->slug,
            'content_type' => $this->content_type?->value,
            'content_type_label' => $this->content_type?->label(),
            'body' => $this->body,
            'video_url' => $this->video_url,
            'duration_minutes' => $this->duration_minutes,
            'sort_order' => $this->sort_order,
            'is_free_preview' => $this->is_free_preview,
        ];
    }
}
