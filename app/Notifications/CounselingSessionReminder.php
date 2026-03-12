<?php

namespace App\Notifications;

use App\Models\CounselingSession;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CounselingSessionReminder extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private CounselingSession $session
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
        $date = $this->session->session_date->format('l, F j, Y');
        $time = $this->session->session_date->format('g:i A');

        return (new MailMessage)
            ->subject('Counseling Session Reminder')
            ->greeting("Hello {$notifiable->name},")
            ->line('You have an upcoming counseling session scheduled.')
            ->line("Date: {$date}")
            ->line("Time: {$time}")
            ->line("Type: {$this->session->session_type->label()}")
            ->line('If you need to reschedule, please contact us as soon as possible.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'counseling_reminder',
            'title' => 'Counseling Session Reminder',
            'message' => "You have a counseling session on {$this->session->session_date->format('M j, Y \\a\\t g:i A')}.",
            'session_id' => $this->session->id,
            'url' => '/dashboard',
        ];
    }
}
