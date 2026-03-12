<?php

namespace App\Notifications;

use App\Models\VolunteerSchedule;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VolunteerAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private VolunteerSchedule $schedule
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
        $roleName = $this->schedule->role?->name ?? 'Volunteer';
        $date = $this->schedule->scheduled_date->format('l, F j, Y');

        return (new MailMessage)
            ->subject("Volunteer Assignment: {$roleName}")
            ->greeting("Hello {$notifiable->name},")
            ->line("You have been assigned as **{$roleName}** on **{$date}**.")
            ->line($this->schedule->serviceTime ? "Service: {$this->schedule->serviceTime->name}" : '')
            ->action('View My Duties', url('/volunteer/my-duties'))
            ->line('Please confirm or decline this assignment at your earliest convenience.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'volunteer_assigned',
            'title' => 'Volunteer Assignment',
            'message' => "You have been assigned as {$this->schedule->role?->name} on {$this->schedule->scheduled_date->format('M j, Y')}.",
            'schedule_id' => $this->schedule->id,
            'url' => '/volunteer/my-duties',
        ];
    }
}
