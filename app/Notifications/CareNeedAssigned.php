<?php

namespace App\Notifications;

use App\Models\CareNeed;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CareNeedAssigned extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private CareNeed $careNeed) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("Care need assigned: {$this->careNeed->type->label()}")
            ->greeting("Hello {$notifiable->name},")
            ->line("You have been asked to look after **{$this->careNeed->title}** for {$this->careNeed->person_name}.");

        if ($this->careNeed->due_on) {
            $mail->line("Please follow up by {$this->careNeed->due_on->format('l, F j')}.");
        }

        return $mail->action('View Care Need', url("/admin/care-needs/{$this->careNeed->id}"));
    }

    /**
     * Confidential details stay out of the notification body.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'care_need_assigned',
            'title' => 'Care Need Assigned',
            'message' => "You were assigned a {$this->careNeed->type->label()} need for {$this->careNeed->person_name}.",
            'care_need_id' => $this->careNeed->id,
            'url' => "/admin/care-needs/{$this->careNeed->id}",
        ];
    }
}
