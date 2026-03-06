<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
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
            'cover_url' => $this->getFirstMediaUrl('cover') ?: null,
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ] : null),
            'difficulty' => $this->difficulty?->value,
            'difficulty_label' => $this->difficulty?->label(),
            'estimated_hours' => $this->estimated_hours,
            'is_published' => $this->is_published,
            'requires_enrollment' => $this->requires_enrollment,
            'max_enrollments' => $this->max_enrollments,
            'modules' => CourseModuleResource::collection($this->whenLoaded('modules')),
            'enrollments_count' => $this->whenCounted('enrollments'),
            'lessons_count' => $this->whenCounted('lessons'),
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ] : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
