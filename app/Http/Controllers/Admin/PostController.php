<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CategoryType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Category;
use App\Models\Post;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class PostController extends Controller
{
    /**
     * Display a listing of posts.
     */
    public function index(Request $request): Response
    {
        $posts = Post::query()
            ->with(['author', 'category'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($request->input('category_id'), function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/posts/index', [
            'posts' => PostResource::collection($posts),
            'filters' => $request->only(['search', 'category_id']),
            'categories' => Category::where('type', CategoryType::Post)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Show the form for creating a new post.
     */
    public function create(): Response
    {
        return Inertia::render('admin/posts/create', [
            'categories' => Category::where('type', CategoryType::Post)->orderBy('name')->get(['id', 'name']),
            'allTags' => Tag::query()->ordered()->pluck('name'),
        ]);
    }

    /**
     * Store a newly created post.
     */
    public function store(StorePostRequest $request): RedirectResponse
    {
        $tags = $request->input('tags', []);

        $post = Post::create([
            ...$request->safe()->except(['tags', 'cover_image', 'remove_cover', 'library_media_id']),
            'author_id' => $request->user()->id,
        ]);

        if (! empty($tags)) {
            $post->syncTags($tags);
        }

        if ($request->hasFile('cover_image')) {
            $post->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $sourceMedia->copy($post, 'cover');
            Log::info('Library media copied to post', [
                'post_id' => $post->id,
                'source_media_id' => $libraryMediaId,
            ]);
        }

        Log::info('Post created', [
            'post_id' => $post->id,
            'title' => $post->title,
            'author_id' => $request->user()->id,
        ]);

        return redirect()->route('admin.posts.index')
            ->with('success', "Post \"{$post->title}\" created.");
    }

    /**
     * Show the form for editing the specified post.
     */
    public function edit(Post $post): Response
    {
        return Inertia::render('admin/posts/edit', [
            'post' => new PostResource($post->load(['author', 'category', 'tags'])),
            'categories' => Category::where('type', CategoryType::Post)->orderBy('name')->get(['id', 'name']),
            'allTags' => Tag::query()->ordered()->pluck('name'),
        ]);
    }

    /**
     * Update the specified post.
     */
    public function update(StorePostRequest $request, Post $post): RedirectResponse
    {
        $tags = $request->input('tags', []);

        $post->update($request->safe()->except(['tags', 'cover_image', 'remove_cover', 'library_media_id']));

        $post->syncTags($tags);

        if ($request->hasFile('cover_image')) {
            $post->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $post->clearMediaCollection('cover');
            $sourceMedia->copy($post, 'cover');
            Log::info('Library media copied to post', [
                'post_id' => $post->id,
                'source_media_id' => $libraryMediaId,
            ]);
        } elseif ($request->boolean('remove_cover')) {
            $post->clearMediaCollection('cover');
        }

        Log::info('Post updated', [
            'post_id' => $post->id,
            'title' => $post->title,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.posts.index')
            ->with('success', "Post \"{$post->title}\" updated.");
    }

    /**
     * Remove the specified post.
     */
    public function destroy(Post $post): RedirectResponse
    {
        $title = $post->title;
        $postId = $post->id;

        $post->delete();

        Log::info('Post deleted', [
            'post_id' => $postId,
            'title' => $title,
        ]);

        return redirect()->route('admin.posts.index')
            ->with('success', "Post \"{$title}\" deleted.");
    }
}
