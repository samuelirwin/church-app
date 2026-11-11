<?php

namespace App\Notifications;

use App\Models\Member;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

class AbsentMembersDetected extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Only this many names are listed; the rest are summarised as "and N more".
     */
    private const NAMES_SHOWN = 10;

    /**
     * @param  Collection<int, Member>  $members
     */
    public function __construct(
        private Collection $members,
        private int $threshold,
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
        $mail = (new MailMessage)
            ->subject("{$this->members->count()} members have missed {$this->threshold} services")
            ->greeting("Hello {$notifiable->name},")
            ->line("These people have missed the last {$this->threshold} services and may need a follow-up:");

        foreach ($this->members->take(self::NAMES_SHOWN) as $member) {
            $mail->line("- {$member->full_name}");
        }

        if ($this->members->count() > self::NAMES_SHOWN) {
            $mail->line('...and '.($this->members->count() - self::NAMES_SHOWN).' more.');
        }

        return $mail->action('View Attendance', url('/admin/attendance'));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $count = $this->members->count();

        return [
            'type' => 'absent_members',
            'title' => 'Members Missing Services',
            'message' => "{$count} ".str('member')->plural($count)." missed the last {$this->threshold} services.",
            'member_ids' => $this->members->modelKeys(),
            'url' => '/admin/attendance',
        ];
    }
}
