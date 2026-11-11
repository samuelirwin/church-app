<?php

namespace App\Notifications;

use App\Models\CareNeed;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells staff a member has asked for care through "My Care Needs".
 */
class CareNeedRequested extends Notification implements ShouldQueue
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
        return (new MailMessage)
            ->subject("New care request: {$this->careNeed->type->label()}")
            ->greeting("Hello {$notifiable->name},")
            ->line("{$this->careNeed->person_name} has asked for help ({$this->careNeed->type->label()}).")
            ->action('View Request', url("/admin/care-needs/{$this->careNeed->id}"));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'care_need_requested',
            'title' => 'New Care Request',
            'message' => "{$this->careNeed->person_name} asked for help: {$this->careNeed->type->label()}.",
            'care_need_id' => $this->careNeed->id,
            'url' => "/admin/care-needs/{$this->careNeed->id}",
        ];
    }
}
