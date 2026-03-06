<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SpeakerResource extends JsonResource
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
            'name' => $this->name,
            'slug' => $this->slug,
            'title' => $this->title,
            'bio' => $this->bio,
            'photo_url' => $this->getFirstMediaUrl('photo') ?: null,
            'sermons_count' => $this->whenCounted('sermons'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
