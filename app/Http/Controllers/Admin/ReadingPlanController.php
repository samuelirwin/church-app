<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\ReadsTableQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreReadingPlanDayRequest;
use App\Http\Requests\Admin\StoreReadingPlanRequest;
use App\Http\Resources\ReadingPlanResource;
use App\Models\ReadingPlan;
use App\Models\ReadingPlanDay;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class ReadingPlanController extends Controller
{
    use ReadsTableQuery;

    /**
     * Sortable columns for the reading plans table, keyed by the sort value the page sends.
     *
     * @var array<string, string>
     */
    private const SORTABLE = [
        'title' => 'title',
        'duration' => 'duration_days',
        'enrolled' => 'enrollments_count',
        'status' => 'is_published',
    ];

    /**
     * Reading plans list. Newest first unless the user picks a column to sort by.
     */
    public function index(Request $request): Response
    {
        [$sort, $direction] = $this->sortInput($request, self::SORTABLE);

        $plans = ReadingPlan::query()
            ->withCount('enrollments')
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($sort, fn ($query) => $query->orderBy(self::SORTABLE[$sort], $direction), fn ($query) => $query->latest())
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $filters = [
            ...$request->only(['search']),
            'sort' => $sort,
            'direction' => $sort ? $direction : null,
        ];

        Log::info('Reading plans listing viewed', ['user_id' => $request->user()->id, 'filters' => $filters]);

        return Inertia::render('admin/reading-plans/index', [
            'plans' => ReadingPlanResource::collection($plans),
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new reading plan.
     */
    public function create(): Response
    {
        return Inertia::render('admin/reading-plans/create');
    }

    /**
     * Store a newly created reading plan.
     */
    public function store(StoreReadingPlanRequest $request): RedirectResponse
    {
        $plan = ReadingPlan::create([
            ...$request->safe()->except(['cover_image', 'remove_cover', 'library_media_id']),
            'created_by' => $request->user()->id,
        ]);

        if ($request->hasFile('cover_image')) {
            $plan->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $sourceMedia->copy($plan, 'cover');
            Log::info('Library media copied to reading plan', [
                'plan_id' => $plan->id,
                'source_media_id' => $libraryMediaId,
            ]);
        }

        Log::info('Reading plan created', [
            'plan_id' => $plan->id,
            'title' => $plan->title,
            'duration_days' => $plan->duration_days,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.reading-plans.show', $plan)
            ->with('success', "Plan \"{$plan->title}\" created. Now add daily readings.");
    }

    /**
     * Display the reading plan with day management.
     */
    public function show(ReadingPlan $readingPlan): Response
    {
        return Inertia::render('admin/reading-plans/days', [
            'plan' => new ReadingPlanResource($readingPlan->load('days')),
        ]);
    }

    /**
     * Show the form for editing the specified reading plan.
     */
    public function edit(ReadingPlan $readingPlan): Response
    {
        return Inertia::render('admin/reading-plans/edit', [
            'plan' => new ReadingPlanResource($readingPlan),
        ]);
    }

    /**
     * Update the specified reading plan.
     */
    public function update(StoreReadingPlanRequest $request, ReadingPlan $readingPlan): RedirectResponse
    {
        $readingPlan->update($request->safe()->except(['cover_image', 'remove_cover', 'library_media_id']));

        if ($request->hasFile('cover_image')) {
            $readingPlan->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $readingPlan->clearMediaCollection('cover');
            $sourceMedia->copy($readingPlan, 'cover');
            Log::info('Library media copied to reading plan', [
                'plan_id' => $readingPlan->id,
                'source_media_id' => $libraryMediaId,
            ]);
        } elseif ($request->boolean('remove_cover')) {
            $readingPlan->clearMediaCollection('cover');
        }

        Log::info('Reading plan updated', [
            'plan_id' => $readingPlan->id,
            'title' => $readingPlan->title,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.reading-plans.index')
            ->with('success', "Plan \"{$readingPlan->title}\" updated.");
    }

    /**
     * Remove the specified reading plan.
     */
    public function destroy(ReadingPlan $readingPlan): RedirectResponse
    {
        $title = $readingPlan->title;
        $planId = $readingPlan->id;

        $readingPlan->delete();

        Log::info('Reading plan deleted', [
            'plan_id' => $planId,
            'title' => $title,
        ]);

        return redirect()->route('admin.reading-plans.index')
            ->with('success', "Plan \"{$title}\" deleted.");
    }

    /**
     * Store a new day for the reading plan.
     */
    public function storeDay(StoreReadingPlanDayRequest $request, ReadingPlan $readingPlan): RedirectResponse
    {
        $day = $readingPlan->days()->create($request->validated());

        Log::info('Reading plan day added', [
            'plan_id' => $readingPlan->id,
            'day_id' => $day->id,
            'day_number' => $day->day_number,
        ]);

        return redirect()->route('admin.reading-plans.show', $readingPlan)
            ->with('success', "Day {$day->day_number} added.");
    }

    /**
     * Update a day in the reading plan.
     */
    public function updateDay(StoreReadingPlanDayRequest $request, ReadingPlan $readingPlan, ReadingPlanDay $day): RedirectResponse
    {
        $day->update($request->validated());

        Log::info('Reading plan day updated', [
            'plan_id' => $readingPlan->id,
            'day_id' => $day->id,
            'day_number' => $day->day_number,
        ]);

        return redirect()->route('admin.reading-plans.show', $readingPlan)
            ->with('success', "Day {$day->day_number} updated.");
    }

    /**
     * Remove a day from the reading plan.
     */
    public function destroyDay(ReadingPlan $readingPlan, ReadingPlanDay $day): RedirectResponse
    {
        $dayNumber = $day->day_number;
        $day->delete();

        Log::info('Reading plan day deleted', [
            'plan_id' => $readingPlan->id,
            'day_number' => $dayNumber,
        ]);

        return redirect()->route('admin.reading-plans.show', $readingPlan)
            ->with('success', "Day {$dayNumber} removed.");
    }
}
