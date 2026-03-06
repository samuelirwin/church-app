<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'redirect_url' => $this->redirect_url,
            'layout' => $this->layout->value,
            'sections' => $this->sections,
            'cover_urls' => $this->getMedia('cover')->map(fn ($media) => $media->getUrl())->all(),
            'cover_media' => $this->getMedia('cover')->map(fn ($media) => [
                'id' => $media->id,
                'url' => $media->getUrl(),
            ])->all(),
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ] : null),
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ] : null),
            'tags' => $this->whenLoaded('tags', fn () => $this->tags->pluck('name')),
            'page_url' => route('pages.show', $this->slug),
            'is_published' => $this->is_published,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
