<?php

namespace App\Http\Controllers\Member;

use App\Enums\RegistrationStatus;
use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EventRegistrationController extends Controller
{
    /**
     * Register the authenticated user for an event.
     */
    public function register(Request $request, Event $event): RedirectResponse
    {
        abort_unless($event->isPublished(), 404);

        $user = $request->user();

        $existing = $event->registrations()
            ->where('user_id', $user->id)
            ->first();

        if ($existing && $existing->status !== RegistrationStatus::Cancelled) {
            return redirect()->back()
                ->with('info', 'You are already registered for this event.');
        }

        if ($event->isFull()) {
            return redirect()->back()
                ->with('error', 'This event is full.');
        }

        $event->registrations()->create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'status' => 'registered',
            'registered_at' => now(),
        ]);

        Log::info('User registered for event', [
            'event_id' => $event->id,
            'user_id' => $user->id,
        ]);

        return redirect()->back()
            ->with('success', 'You have been registered for this event.');
    }

    /**
     * Cancel the authenticated user's registration.
     */
    public function cancel(Request $request, Event $event): RedirectResponse
    {
        $user = $request->user();

        $registration = $event->registrations()
            ->where('user_id', $user->id)
            ->where('status', '!=', RegistrationStatus::Cancelled->value)
            ->first();

        if (! $registration) {
            return redirect()->back()
                ->with('error', 'No active registration found.');
        }

        $registration->update(['status' => 'cancelled']);

        Log::info('User cancelled event registration', [
            'event_id' => $event->id,
            'user_id' => $user->id,
            'registration_id' => $registration->id,
        ]);

        return redirect()->back()
            ->with('success', 'Your registration has been cancelled.');
    }
}
