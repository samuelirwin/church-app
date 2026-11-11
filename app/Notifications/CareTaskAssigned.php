<?php

namespace App\Notifications;

use App\Models\CareNeedTask;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CareTaskAssigned extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private CareNeedTask $task) {}

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
            ->subject("Care task: {$this->task->description}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Thank you for helping with **{$this->task->description}** for {$this->task->careNeed->person_name}.");

        if ($this->task->due_on) {
            $mail->line("This is needed by {$this->task->due_on->format('l, F j')}.");
        }

        return $mail->action('View Details', url("/admin/care-needs/{$this->task->care_need_id}"));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'care_task_assigned',
            'title' => 'Care Task Assigned',
            'message' => "You are helping with: {$this->task->description}.",
            'care_need_task_id' => $this->task->id,
            'url' => "/admin/care-needs/{$this->task->care_need_id}",
        ];
    }
}
