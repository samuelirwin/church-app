<?php

namespace App\Http\Controllers;

use App\Enums\DocumentVisibility;
use App\Http\Requests\SearchRequest;
use App\Models\Book;
use App\Models\Course;
use App\Models\Document;
use App\Models\Event;
use App\Models\Member;
use App\Models\Page;
use App\Models\Post;
use App\Models\Sermon;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class SearchController extends Controller
{
    public function __invoke(SearchRequest $request): JsonResponse
    {
        $query = $request->validated('q');
        $user = $request->user();
        $limit = 5;

        Log::info('Global search executed', [
            'query' => $query,
            'user_id' => $user?->id,
        ]);

        $results = [];

        $results['sermons'] = Sermon::query()
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->where(fn ($q) => $q
                ->where('title', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%"))
            ->limit($limit)
            ->get()
            ->map(fn (Sermon $s) => [
                'id' => $s->id,
                'title' => $s->title,
                'url' => route('sermons.show', $s->slug),
            ]);

        $results['events'] = Event::query()
            ->where('is_published', true)
            ->where(fn ($q) => $q
                ->where('title', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%"))
            ->limit($limit)
            ->get()
            ->map(fn (Event $e) => [
                'id' => $e->id,
                'title' => $e->title,
                'url' => route('events.show', $e->slug),
            ]);

        $visibilities = [DocumentVisibility::Public];
        if ($user) {
            $visibilities[] = DocumentVisibility::Members;
            if ($user->isStaffOrAbove()) {
                $visibilities[] = DocumentVisibility::Admin;
            }
        }

        $results['documents'] = Document::query()
            ->whereIn('visibility', $visibilities)
            ->where(fn ($q) => $q
                ->where('title', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%"))
            ->limit($limit)
            ->get()
            ->map(fn (Document $d) => [
                'id' => $d->id,
                'title' => $d->title,
                'url' => route('documents.show', $d->slug),
            ]);

        $results['courses'] = Course::query()
            ->where('is_published', true)
            ->where(fn ($q) => $q
                ->where('title', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%"))
            ->limit($limit)
            ->get()
            ->map(fn (Course $c) => [
                'id' => $c->id,
                'title' => $c->title,
                'url' => route('courses.show', $c->slug),
            ]);

        $results['books'] = Book::query()
            ->where(fn ($q) => $q
                ->where('title', 'like', "%{$query}%")
                ->orWhere('author', 'like', "%{$query}%"))
            ->limit($limit)
            ->get()
            ->map(fn (Book $b) => [
                'id' => $b->id,
                'title' => $b->title,
                'url' => route('books.show', $b->slug),
            ]);

        $results['posts'] = Post::query()
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->where(fn ($q) => $q
                ->where('title', 'like', "%{$query}%")
                ->orWhere('body', 'like', "%{$query}%"))
            ->limit($limit)
            ->get()
            ->map(fn (Post $p) => [
                'id' => $p->id,
                'title' => $p->title,
                'url' => route('posts.show', $p->slug),
            ]);

        $results['pages'] = Page::query()
            ->where('is_published', true)
            ->where(fn ($q) => $q
                ->where('title', 'like', "%{$query}%"))
            ->limit($limit)
            ->get()
            ->map(fn (Page $p) => [
                'id' => $p->id,
                'title' => $p->title,
                'url' => route('pages.show', $p->slug),
            ]);

        if ($user?->isLeaderOrAbove()) {
            $results['members'] = Member::query()
                ->visibleTo($user)
                ->search($query)
                ->limit($limit)
                ->get()
                ->map(fn (Member $m) => [
                    'id' => $m->id,
                    'title' => $m->full_name,
                    'url' => route('admin.members.show', $m),
                ]);
        }

        if ($user?->isAdmin()) {
            $results['users'] = User::query()
                ->where(fn ($q) => $q
                    ->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%"))
                ->limit($limit)
                ->get()
                ->map(fn (User $u) => [
                    'id' => $u->id,
                    'title' => $u->name,
                    'url' => route('admin.users.edit', $u),
                ]);
        }

        // Filter out empty groups
        $results = array_filter($results, fn ($group) => $group->isNotEmpty());

        return response()->json($results);
    }
}
