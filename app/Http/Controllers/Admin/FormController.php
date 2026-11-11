<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\ReadsTableQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreFormRequest;
use App\Http\Resources\FormResource;
use App\Http\Resources\FormResponseResource;
use App\Models\Form;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class FormController extends Controller
{
    use ReadsTableQuery;

    /**
     * Sortable columns for the forms table, keyed by the sort value the page sends.
     *
     * @var array<string, string>
     */
    private const SORTABLE = [
        'title' => 'title',
        'responses' => 'responses_count',
        'status' => 'is_published',
    ];

    /**
     * Status filter values mapped to is_published.
     *
     * @var array<string, bool>
     */
    private const STATUS_FILTERS = [
        'published' => true,
        'draft' => false,
    ];

    /**
     * Forms list. Newest first unless the user picks a column to sort by.
     */
    public function index(Request $request): Response
    {
        $statuses = array_values(array_intersect($this->listInput($request, 'status'), array_keys(self::STATUS_FILTERS)));
        [$sort, $direction] = $this->sortInput($request, self::SORTABLE);

        $forms = Form::query()
            ->withCount('responses')
            ->with('creator')
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($statuses, fn ($query) => $query->whereIn('is_published', array_map(fn (string $status) => self::STATUS_FILTERS[$status], $statuses)))
            ->when($sort, fn ($query) => $query->orderBy(self::SORTABLE[$sort], $direction), fn ($query) => $query->latest())
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $filters = [
            ...$request->only(['search']),
            'status' => $statuses,
            'sort' => $sort,
            'direction' => $sort ? $direction : null,
        ];

        Log::info('Forms listing viewed', ['user_id' => $request->user()->id, 'filters' => $filters]);

        return Inertia::render('admin/forms/index', [
            'forms' => FormResource::collection($forms),
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new form.
     */
    public function create(): Response
    {
        return Inertia::render('admin/forms/create');
    }

    /**
     * Store a newly created form.
     */
    public function store(StoreFormRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['created_by'] = $request->user()->id;

        $form = Form::create($validated);

        Log::info('Form created', [
            'form_id' => $form->id,
            'title' => $form->title,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.forms.index')
            ->with('success', "Form \"{$form->title}\" created.");
    }

    /**
     * Show the form for editing the specified form.
     */
    public function edit(Form $form): Response
    {
        return Inertia::render('admin/forms/edit', [
            'form' => new FormResource($form->load('creator')),
        ]);
    }

    /**
     * Update the specified form.
     */
    public function update(StoreFormRequest $request, Form $form): RedirectResponse
    {
        $form->update($request->validated());

        Log::info('Form updated', [
            'form_id' => $form->id,
            'title' => $form->title,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.forms.index')
            ->with('success', "Form \"{$form->title}\" updated.");
    }

    /**
     * Remove the specified form.
     */
    public function destroy(Form $form): RedirectResponse
    {
        $title = $form->title;
        $formId = $form->id;

        $form->delete();

        Log::info('Form deleted', [
            'form_id' => $formId,
            'title' => $title,
        ]);

        return redirect()->route('admin.forms.index')
            ->with('success', "Form \"{$title}\" deleted.");
    }

    /**
     * Display responses for a specific form.
     */
    public function responses(Form $form): Response
    {
        $responses = $form->responses()
            ->with('user')
            ->latest('submitted_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/forms/responses', [
            'form' => new FormResource($form->loadCount('responses')),
            'responses' => FormResponseResource::collection($responses),
        ]);
    }
}
