<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MediaLibraryController extends Controller
{
    /**
     * Browse all media in the library with search and mime type filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Media::query()->orderByDesc('created_at');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('file_name', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        if ($mimeFilter = $request->input('mime_filter')) {
            $query->where('mime_type', 'like', "{$mimeFilter}%");
        }

        $paginated = $query->paginate(24);

        $data = $paginated->getCollection()->map(fn (Media $media) => [
            'id' => $media->id,
            'name' => $media->name,
            'file_name' => $media->file_name,
            'mime_type' => $media->mime_type,
            'size' => $media->size,
            'url' => $media->getUrl(),
            'collection_name' => $media->collection_name,
            'model_type' => class_basename($media->model_type),
            'created_at' => $media->created_at->toISOString(),
        ]);

        Log::debug('Media library browsed', [
            'user_id' => $request->user()->id,
            'search' => $search,
            'mime_filter' => $mimeFilter,
            'results' => $paginated->total(),
        ]);

        return response()->json([
            'data' => $data,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }
}
