<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookResource extends JsonResource
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
            'author' => $this->author,
            'isbn' => $this->isbn,
            'publisher' => $this->publisher,
            'description' => $this->description,
            'cover_url' => $this->getFirstMediaUrl('cover') ?: null,
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ] : null),
            'total_copies' => $this->total_copies,
            'available_copies' => $this->available_copies,
            'is_available' => $this->isAvailable(),
            'location' => $this->location,
            'is_published' => $this->is_published,
            'lendings_count' => $this->whenCounted('lendings'),
            'created_at' => $this->created_at,
        ];
    }
}
