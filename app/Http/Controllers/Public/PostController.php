<?php

namespace App\Http\Controllers\Public;

use App\Enums\CategoryType;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Category;
use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    /**
     * Display a listing of published posts.
     */
    public function index(Request $request): Response
    {
        $posts = Post::query()
            ->published()
            ->with(['author', 'category', 'media'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($request->input('category'), function ($query, $categorySlug) {
                $query->whereHas('category', fn ($q) => $q->where('slug', $categorySlug));
            })
            ->latest('published_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('public/updates/index', [
            'posts' => PostResource::collection($posts),
            'filters' => $request->only(['search', 'category']),
            'categories' => Category::where('type', CategoryType::Post)->orderBy('name')->get(['id', 'name', 'slug']),
        ]);
    }

    /**
     * Display the specified published post.
     */
    public function show(Post $post): Response
    {
        abort_unless($post->isPublished(), 404);

        $post->load(['author', 'category', 'media', 'tags']);

        $relatedPosts = Post::query()
            ->published()
            ->with(['author', 'media'])
            ->where('id', '!=', $post->id)
            ->when($post->category_id, fn ($q) => $q->where('category_id', $post->category_id))
            ->latest('published_at')
            ->limit(4)
            ->get();

        return Inertia::render('public/updates/show', [
            'post' => new PostResource($post),
            'relatedPosts' => PostResource::collection($relatedPosts),
        ]);
    }
}
