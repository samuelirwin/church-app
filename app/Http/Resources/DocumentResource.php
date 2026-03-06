<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $fileMedia = $this->getFirstMedia('file');

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'visibility' => $this->visibility->value,
            'visibility_label' => $this->visibility->label(),
            'file_url' => $fileMedia?->getUrl(),
            'file_name' => $fileMedia?->file_name,
            'file_size' => $fileMedia?->size,
            'file_mime_type' => $fileMedia?->mime_type,
            'is_pdf' => $this->isPdf(),
            'is_image' => $this->isImage(),
            'thumbnail_url' => $this->getFirstMediaUrl('thumbnail') ?: null,
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ] : null),
            'uploader' => $this->whenLoaded('uploader', fn () => $this->uploader ? [
                'id' => $this->uploader->id,
                'name' => $this->uploader->name,
            ] : null),
            'tags' => $this->whenLoaded('tags', fn () => $this->tags->pluck('name')),
            'is_published' => $this->is_published,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
