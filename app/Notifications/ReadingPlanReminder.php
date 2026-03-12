<?php

namespace App\Notifications;

use App\Models\ReadingPlan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ReadingPlanReminder extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private ReadingPlan $readingPlan
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'reading_plan_reminder',
            'title' => 'Reading Plan Reminder',
            'message' => "Don't forget to complete today's reading in \"{$this->readingPlan->title}\".",
            'reading_plan_id' => $this->readingPlan->id,
            'url' => "/reading-plans/{$this->readingPlan->slug}",
        ];
    }
}
