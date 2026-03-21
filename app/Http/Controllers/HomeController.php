<?php

namespace App\Http\Controllers;

use App\Http\Resources\CourseResource;
use App\Http\Resources\EventResource;
use App\Http\Resources\HighlightResource;
use App\Http\Resources\PostResource;
use App\Http\Resources\SermonResource;
use App\Models\Course;
use App\Models\Event;
use App\Models\HeroSlide;
use App\Models\Highlight;
use App\Models\Post;
use App\Models\Sermon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Display the church landing page with dynamic content sections.
     */
    public function __invoke(Request $request): Response
    {
        Log::info('Home page viewed', ['ip' => $request->ip()]);

        $heroSlides = HeroSlide::active()
            ->orderBy('sort_order')
            ->get()
            ->map(fn (HeroSlide $slide) => [
                'id' => $slide->id,
                'image_url' => $slide->getFirstMediaUrl('image'),
                'title' => $slide->title,
                'subtitle' => $slide->subtitle,
                'link_url' => $slide->link_url,
                'link_text' => $slide->link_text,
            ])
            ->filter(fn (array $slide) => $slide['image_url'] !== '')
            ->values();

        $currentSermon = Sermon::with('speaker')
            ->published()
            ->currentWeek()
            ->first();

        if (! $currentSermon) {
            $currentSermon = Sermon::with('speaker')
                ->published()
                ->latest('sermon_date')
                ->first();
        }

        $highlights = Highlight::with('media')
            ->active()
            ->orderBy('priority')
            ->limit(3)
            ->get();

        $recentPosts = Post::with(['author', 'media'])
            ->published()
            ->latest('published_at')
            ->limit(3)
            ->get();

        $featuredCourses = Course::with('media')
            ->published()
            ->latest()
            ->limit(3)
            ->get();

        $upcomingEvents = Event::published()
            ->upcoming()
            ->orderBy('starts_at')
            ->limit(3)
            ->get();

        return Inertia::render('welcome', [
            'heroSlides' => $heroSlides,
            'currentSermon' => $currentSermon ? (new SermonResource($currentSermon))->resolve() : null,
            'highlights' => HighlightResource::collection($highlights),
            'recentPosts' => PostResource::collection($recentPosts),
            'featuredCourses' => CourseResource::collection($featuredCourses),
            'upcomingEvents' => EventResource::collection($upcomingEvents),
        ]);
    }
}
