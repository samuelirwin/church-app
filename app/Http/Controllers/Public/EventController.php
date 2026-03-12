<?php

namespace App\Http\Controllers\Public;

use App\Enums\CategoryType;
use App\Enums\RegistrationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\RegisterForEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Category;
use App\Models\Event;
use App\Notifications\EventRegistrationConfirmation;
use App\Services\FormValidationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function __construct(
        private FormValidationService $formValidationService
    ) {}

    /**
     * Display a listing of published upcoming events.
     */
    public function index(Request $request): Response
    {
        $events = Event::query()
            ->published()
            ->with('category')
            ->withCount('registrations')
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            })
            ->when($request->input('category_id'), function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->orderBy('starts_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('public/events/index', [
            'events' => EventResource::collection($events),
            'filters' => $request->only(['search', 'category_id']),
            'categories' => Category::where('type', CategoryType::Event)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Display the specified event.
     */
    public function show(Request $request, Event $event): Response
    {
        abort_unless($event->isPublished(), 404);

        $event->load(['category', 'media', 'tags', 'registrationForm']);
        $event->loadCount('registrations');

        $userRegistration = null;
        if ($request->user()) {
            $userRegistration = $event->registrations()
                ->where('user_id', $request->user()->id)
                ->first();
        }

        return Inertia::render('public/events/show', [
            'event' => new EventResource($event),
            'userRegistration' => $userRegistration ? [
                'id' => $userRegistration->id,
                'status' => $userRegistration->status->value,
            ] : null,
        ]);
    }

    /**
     * Register a guest for an event.
     */
    public function register(RegisterForEventRequest $request, Event $event): RedirectResponse
    {
        abort_unless($event->isPublished(), 404);

        if ($event->isFull()) {
            return redirect()->back()
                ->with('error', 'This event is full.');
        }

        $existing = $event->registrations()
            ->where('email', $request->input('email'))
            ->first();

        if ($existing && $existing->status !== RegistrationStatus::Cancelled) {
            return redirect()->back()
                ->with('error', 'This email is already registered for this event.');
        }

        $formResponseId = null;

        if ($event->form_id && $event->registrationForm) {
            $formRules = $this->formValidationService->buildValidationRules($event->registrationForm, 'answers');
            $validated = $request->validate($formRules);

            $score = null;
            if ($event->registrationForm->isScoringEnabled()) {
                $score = $this->formValidationService->calculateScore(
                    $event->registrationForm,
                    $validated['answers'] ?? []
                );
            }

            $formResponse = $event->registrationForm->responses()->create([
                'user_id' => $request->user()?->id,
                'answers' => $validated['answers'] ?? [],
                'score' => $score,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'submitted_at' => now(),
            ]);

            $formResponseId = $formResponse->id;

            Log::info('Form response created for event registration', [
                'event_id' => $event->id,
                'form_id' => $event->form_id,
                'form_response_id' => $formResponse->id,
            ]);
        }

        $event->registrations()->create([
            'user_id' => $request->user()?->id,
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'phone' => $request->input('phone'),
            'status' => 'registered',
            'registered_at' => now(),
            'form_response_id' => $formResponseId,
        ]);

        if ($request->user()) {
            $request->user()->notify(new EventRegistrationConfirmation($event));
        }

        Log::info('Guest registered for event', [
            'event_id' => $event->id,
            'email' => $request->input('email'),
            'has_form_response' => $formResponseId !== null,
        ]);

        return redirect()->back()
            ->with('success', 'You have been registered for this event.');
    }
}
