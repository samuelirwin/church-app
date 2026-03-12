<?php

use App\Models\BenevolentRequest;
use App\Models\Event;
use App\Models\Form;
use App\Models\User;
use App\Models\VolunteerRole;
use App\Notifications\BenevolenceStatusUpdate;
use App\Notifications\EventRegistrationConfirmation;
use App\Notifications\FormResponseReceived;
use App\Notifications\VolunteerAssignedNotification;
use Illuminate\Support\Facades\Notification;

it('displays notifications page for authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('member/notifications/index')
            ->has('notifications')
        );
});

it('marks a notification as read', function () {
    $user = User::factory()->create();

    $user->notify(new EventRegistrationConfirmation(
        Event::factory()->published()->create()
    ));

    $notification = $user->notifications()->first();

    expect($notification->read_at)->toBeNull();

    $this->actingAs($user)
        ->post(route('notifications.markAsRead', $notification->id))
        ->assertRedirect();

    $notification->refresh();
    expect($notification->read_at)->not->toBeNull();
});

it('marks all notifications as read', function () {
    $user = User::factory()->create();

    $user->notify(new EventRegistrationConfirmation(
        Event::factory()->published()->create()
    ));
    $user->notify(new EventRegistrationConfirmation(
        Event::factory()->published()->create()
    ));

    expect($user->unreadNotifications()->count())->toBe(2);

    $this->actingAs($user)
        ->post(route('notifications.markAllAsRead'))
        ->assertRedirect();

    expect($user->fresh()->unreadNotifications()->count())->toBe(0);
});

it('shares unread notification count via inertia', function () {
    $user = User::factory()->create();

    $user->notify(new EventRegistrationConfirmation(
        Event::factory()->published()->create()
    ));

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('unreadNotificationCount', 1)
        );
});

it('dispatches volunteer assigned notification on schedule create', function () {
    Notification::fake();

    $admin = User::factory()->admin()->create();
    $volunteer = User::factory()->create();
    $role = VolunteerRole::factory()->create();
    $serviceTime = \App\Models\ServiceTime::factory()->create();

    $this->actingAs($admin)
        ->post('/admin/volunteer/schedule', [
            'volunteer_role_id' => $role->id,
            'user_id' => $volunteer->id,
            'scheduled_date' => now()->addDays(3)->toDateString(),
            'service_time_id' => $serviceTime->id,
        ])
        ->assertRedirect();

    Notification::assertSentTo($volunteer, VolunteerAssignedNotification::class);
});

it('dispatches event registration confirmation on member registration', function () {
    Notification::fake();

    $user = User::factory()->create();
    $event = Event::factory()->published()->create();

    $this->actingAs($user)
        ->post("/events/{$event->id}/rsvp")
        ->assertRedirect();

    Notification::assertSentTo($user, EventRegistrationConfirmation::class);
});

it('dispatches benevolence status update on decision', function () {
    Notification::fake();

    $admin = User::factory()->admin()->create();
    $requester = User::factory()->create();

    $benevolentRequest = BenevolentRequest::factory()->create([
        'created_by' => $requester->id,
    ]);

    $this->actingAs($admin)
        ->post("/admin/benevolent-requests/{$benevolentRequest->id}/decide", [
            'status' => 'approved',
            'amount_approved' => 500,
            'final_decision_notes' => 'Approved for full amount.',
        ])
        ->assertRedirect();

    Notification::assertSentTo($requester, BenevolenceStatusUpdate::class);
});

it('dispatches form response received notification on submit', function () {
    Notification::fake();

    $formCreator = User::factory()->create();
    $form = Form::factory()->published()->create([
        'created_by' => $formCreator->id,
        'allows_anonymous' => true,
        'fields' => [
            [
                'id' => 'name_field',
                'type' => 'text',
                'label' => 'Your Name',
                'required' => true,
            ],
        ],
    ]);

    $this->post(route('forms.submit', $form->slug), [
        'answers' => [
            'name_field' => 'John Doe',
        ],
    ])->assertRedirect();

    Notification::assertSentTo($formCreator, FormResponseReceived::class);
});

it('requires authentication for notifications page', function () {
    $this->get(route('notifications.index'))
        ->assertRedirect(route('login'));
});

it('returns 404 for non-existent notification when marking as read', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('notifications.markAsRead', 'non-existent-id'))
        ->assertNotFound();
});
