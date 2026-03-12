<?php

namespace App\Notifications;

use App\Models\Form;
use App\Models\FormResponse;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FormResponseReceived extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private Form $form,
        private FormResponse $formResponse
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (! empty($this->form->notification_emails)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New Response: {$this->form->title}")
            ->greeting("Hello {$notifiable->name},")
            ->line("A new response has been submitted to the form \"{$this->form->title}\".")
            ->action('View Responses', url("/admin/forms/{$this->form->id}"))
            ->line('This is an automated notification.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'form_response',
            'title' => 'New Form Response',
            'message' => "A new response was submitted to \"{$this->form->title}\".",
            'form_id' => $this->form->id,
            'response_id' => $this->formResponse->id,
            'url' => "/admin/forms/{$this->form->id}",
        ];
    }
}
