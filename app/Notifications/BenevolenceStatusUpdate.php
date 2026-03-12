<?php

namespace App\Notifications;

use App\Models\BenevolentRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BenevolenceStatusUpdate extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private BenevolentRequest $benevolentRequest
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
        $statusLabel = $this->benevolentRequest->status->label();

        return (new MailMessage)
            ->subject("Benevolence Request Update: {$statusLabel}")
            ->greeting("Hello {$notifiable->name},")
            ->line('Your benevolence request has been updated.')
            ->line("Status: **{$statusLabel}**")
            ->when(
                $this->benevolentRequest->final_decision_notes,
                fn (MailMessage $mail) => $mail->line("Notes: {$this->benevolentRequest->final_decision_notes}")
            )
            ->line('If you have any questions, please contact the church office.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'benevolence_update',
            'title' => 'Benevolence Request Update',
            'message' => "Your benevolence request status has been updated to: {$this->benevolentRequest->status->label()}.",
            'request_id' => $this->benevolentRequest->id,
            'url' => '/dashboard',
        ];
    }
}
