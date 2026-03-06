<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SermonResourceItemResource extends JsonResource
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
            'download_url' => $this->whenLoaded('media', fn () => $this->media?->url),
            'file_type' => $this->whenLoaded('media', fn () => $this->media?->mime_type),
            'file_size' => $this->whenLoaded('media', fn () => $this->media?->human_size),
            'sort_order' => $this->sort_order,
        ];
    }
}
