<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSpeakerRequest;
use App\Http\Resources\SpeakerResource;
use App\Models\Speaker;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class SpeakerController extends Controller
{
    /**
     * Display a listing of speakers.
     */
    public function index(Request $request): Response
    {
        $speakers = Speaker::query()
            ->withCount('sermons')
            ->when($request->input('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/speakers/index', [
            'speakers' => SpeakerResource::collection($speakers),
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new speaker.
     */
    public function create(): Response
    {
        return Inertia::render('admin/speakers/create');
    }

    /**
     * Store a newly created speaker.
     */
    public function store(StoreSpeakerRequest $request): RedirectResponse
    {
        $speaker = Speaker::create($request->safe()->except(['photo_image', 'remove_photo', 'library_media_id']));

        if ($request->hasFile('photo_image')) {
            $speaker->addMediaFromRequest('photo_image')
                ->toMediaCollection('photo');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $sourceMedia->copy($speaker, 'photo');
            Log::info('Library media copied to speaker', [
                'speaker_id' => $speaker->id,
                'source_media_id' => $libraryMediaId,
            ]);
        }

        Log::info('Speaker created', [
            'speaker_id' => $speaker->id,
            'name' => $speaker->name,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.speakers.index')
            ->with('success', "Speaker \"{$speaker->name}\" created.");
    }

    /**
     * Show the form for editing the specified speaker.
     */
    public function edit(Speaker $speaker): Response
    {
        return Inertia::render('admin/speakers/edit', [
            'speaker' => new SpeakerResource($speaker),
        ]);
    }

    /**
     * Update the specified speaker.
     */
    public function update(StoreSpeakerRequest $request, Speaker $speaker): RedirectResponse
    {
        $speaker->update($request->safe()->except(['photo_image', 'remove_photo', 'library_media_id']));

        if ($request->hasFile('photo_image')) {
            $speaker->addMediaFromRequest('photo_image')
                ->toMediaCollection('photo');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $speaker->clearMediaCollection('photo');
            $sourceMedia->copy($speaker, 'photo');
            Log::info('Library media copied to speaker', [
                'speaker_id' => $speaker->id,
                'source_media_id' => $libraryMediaId,
            ]);
        } elseif ($request->boolean('remove_photo')) {
            $speaker->clearMediaCollection('photo');
        }

        Log::info('Speaker updated', [
            'speaker_id' => $speaker->id,
            'name' => $speaker->name,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.speakers.index')
            ->with('success', "Speaker \"{$speaker->name}\" updated.");
    }

    /**
     * Remove the specified speaker.
     */
    public function destroy(Speaker $speaker): RedirectResponse
    {
        $name = $speaker->name;
        $speakerId = $speaker->id;

        $speaker->delete();

        Log::info('Speaker deleted', [
            'speaker_id' => $speakerId,
            'name' => $name,
        ]);

        return redirect()->route('admin.speakers.index')
            ->with('success', "Speaker \"{$name}\" deleted.");
    }
}
