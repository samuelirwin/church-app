<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SermonResource extends JsonResource
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
            'description' => $this->description,
            'notes' => $this->notes,
            'scripture_references' => $this->scripture_references,
            'sermon_date' => $this->sermon_date?->toDateString(),
            'is_current_week' => $this->is_current_week,
            'video_url' => $this->video_url,
            'audio_url' => $this->getFirstMediaUrl('audio') ?: null,
            'cover_url' => $this->getFirstMediaUrl('cover') ?: null,
            'speaker' => new SpeakerResource($this->whenLoaded('speaker')),
            'series' => new SermonSeriesResource($this->whenLoaded('series')),
            'resources' => SermonResourceItemResource::collection($this->whenLoaded('resources')),
            'tags' => $this->whenLoaded('tags', fn () => $this->tags->pluck('name')),
            'is_published' => $this->isPublished(),
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
