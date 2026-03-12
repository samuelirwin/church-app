<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventRegistrationConfirmation extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private Event $event
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $date = $this->event->starts_at->format('l, F j, Y');
        $time = $this->event->is_all_day ? 'All Day' : $this->event->starts_at->format('g:i A');

        return (new MailMessage)
            ->subject("Registration Confirmed: {$this->event->title}")
            ->greeting("Hello {$notifiable->name},")
            ->line("You are registered for **{$this->event->title}**.")
            ->line("Date: {$date}")
            ->line("Time: {$time}")
            ->when($this->event->location, fn (MailMessage $mail) => $mail->line("Location: {$this->event->location}"))
            ->action('View Event', url("/events/{$this->event->slug}"))
            ->line('We look forward to seeing you there!');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'event_registration',
            'title' => 'Event Registration Confirmed',
            'message' => "You are registered for {$this->event->title} on {$this->event->starts_at->format('M j, Y')}.",
            'event_id' => $this->event->id,
            'url' => "/events/{$this->event->slug}",
        ];
    }
}
