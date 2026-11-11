<?php

namespace App\Services;

use App\Enums\BenevolentCategory;
use App\Enums\BenevolentStatus;
use App\Enums\CareNeedPriority;
use App\Enums\CareNeedSource;
use App\Enums\CareNeedStatus;
use App\Enums\CareNeedType;
use App\Enums\CaseStatus;
use App\Enums\CaseType;
use App\Enums\ContactMethod;
use App\Enums\UserRole;
use App\Models\BenevolentRequest;
use App\Models\CareNeed;
use App\Models\CareNeedPrayer;
use App\Models\CareNeedTask;
use App\Models\CounselingCase;
use App\Models\Member;
use App\Models\User;
use App\Notifications\CareNeedAssigned;
use App\Notifications\CareNeedRequested;
use App\Notifications\CareTaskAssigned;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

/**
 * Business rules for care needs. Every change goes through here so the
 * timeline, notifications, and logs stay consistent wherever it happens.
 */
class CareNeedService
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes, ?User $createdBy = null): CareNeed
    {
        $careNeed = DB::transaction(function () use ($attributes, $createdBy) {
            $careNeed = CareNeed::create([...$attributes, 'created_by' => $createdBy?->id]);

            $careNeed->updates()->create([
                'user_id' => $createdBy?->id,
                'body' => 'Care need opened ('.$careNeed->source->label().').',
                'contact_method' => ContactMethod::Note,
                'to_status' => $careNeed->status,
            ]);

            return $careNeed;
        });

        Log::info('Care need created', [
            'care_need_id' => $careNeed->id,
            'type' => $careNeed->type->value,
            'source' => $careNeed->source->value,
            'member_id' => $careNeed->member_id,
            'is_confidential' => $careNeed->is_confidential,
            'created_by' => $createdBy?->id,
        ]);

        if ($careNeed->assigned_to) {
            $this->notifyAssignee($careNeed);
        }

        if ($careNeed->source === CareNeedSource::MemberRequest) {
            $this->notifyCareTeamOfRequest($careNeed);
        }

        return $careNeed;
    }

    /**
     * Open an absence follow-up for a member, unless one is already open.
     */
    public function openForAbsence(Member $member, int $missedServices): ?CareNeed
    {
        $alreadyOpen = $member->careNeeds()
            ->active()
            ->where('type', CareNeedType::AbsenceFollowUp)
            ->exists();

        if ($alreadyOpen) {
            return null;
        }

        return $this->create([
            'member_id' => $member->id,
            'title' => "Follow up: missed the last {$missedServices} services",
            'type' => CareNeedType::AbsenceFollowUp,
            'priority' => CareNeedPriority::Normal,
            'source' => CareNeedSource::Absence,
            'due_on' => now()->addWeek()->toDateString(),
        ]);
    }

    /**
     * Edit the main details. Status and assignment changes are routed through
     * their own methods so they're recorded on the timeline.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function update(CareNeed $careNeed, array $attributes, User $updatedBy): CareNeed
    {
        $status = isset($attributes['status']) ? CareNeedStatus::from($attributes['status']) : null;
        $hasAssignee = array_key_exists('assigned_to', $attributes);
        $assigneeId = $attributes['assigned_to'] ?? null;
        unset($attributes['status'], $attributes['assigned_to']);

        $careNeed->update($attributes);

        if ($hasAssignee) {
            $this->assign($careNeed, $assigneeId ? User::find($assigneeId) : null, $updatedBy);
        }

        if ($status) {
            $this->changeStatus($careNeed, $status, $updatedBy);
        }

        Log::info('Care need updated', [
            'care_need_id' => $careNeed->id,
            'changed_fields' => array_keys($careNeed->getChanges()),
            'updated_by' => $updatedBy->id,
        ]);

        return $careNeed;
    }

    public function assign(CareNeed $careNeed, ?User $assignee, User $assignedBy): void
    {
        if ($careNeed->assigned_to === $assignee?->id) {
            return;
        }

        $careNeed->update(['assigned_to' => $assignee?->id]);

        $careNeed->updates()->create([
            'user_id' => $assignedBy->id,
            'body' => $assignee ? "Assigned to {$assignee->name}." : 'Unassigned.',
            'contact_method' => ContactMethod::Note,
        ]);

        Log::info('Care need assigned', [
            'care_need_id' => $careNeed->id,
            'assigned_to' => $assignee?->id,
            'assigned_by' => $assignedBy->id,
        ]);

        if ($assignee && $assignee->id !== $assignedBy->id) {
            $this->notifyAssignee($careNeed);
        }
    }

    /**
     * Move to a new status. Resolving or closing stamps resolved_at; reopening clears it.
     */
    public function changeStatus(CareNeed $careNeed, CareNeedStatus $status, ?User $changedBy, ?string $note = null): void
    {
        $previous = $careNeed->status;

        if ($previous === $status) {
            return;
        }

        $careNeed->update(['status' => $status, 'resolved_at' => $this->resolvedAtFor($status)]);

        $careNeed->updates()->create([
            'user_id' => $changedBy?->id,
            'body' => $note ?: "Status changed to {$status->label()}.",
            'contact_method' => ContactMethod::Note,
            'from_status' => $previous,
            'to_status' => $status,
        ]);

        Log::info('Care need status changed', [
            'care_need_id' => $careNeed->id,
            'from' => $previous->value,
            'to' => $status->value,
            'changed_by' => $changedBy?->id,
        ]);
    }

    /**
     * Add a note, call, or visit to the timeline, optionally moving the status at the same time.
     */
    public function addUpdate(CareNeed $careNeed, string $body, ContactMethod $method, User $author, ?CareNeedStatus $status = null): void
    {
        $previous = $careNeed->status;
        $statusChanged = $status !== null && $status !== $previous;

        if ($statusChanged) {
            $careNeed->update(['status' => $status, 'resolved_at' => $this->resolvedAtFor($status)]);
        }

        $careNeed->updates()->create([
            'user_id' => $author->id,
            'body' => $body,
            'contact_method' => $method,
            'from_status' => $statusChanged ? $previous : null,
            'to_status' => $statusChanged ? $status : null,
        ]);

        // Someone actually reaching out on an open need means it's now in progress.
        if (! $statusChanged && $previous === CareNeedStatus::Open && $method !== ContactMethod::Note) {
            $this->changeStatus($careNeed, CareNeedStatus::InProgress, $author, 'Marked in progress after first contact.');
        }

        Log::info('Care need update added', [
            'care_need_id' => $careNeed->id,
            'method' => $method->value,
            'status' => $careNeed->status->value,
            'user_id' => $author->id,
        ]);
    }

    /**
     * Hand a need over to the Benevolence committee as a financial request.
     */
    public function escalateToBenevolence(CareNeed $careNeed, User $escalatedBy, ?float $amountRequested = null): BenevolentRequest
    {
        $request = DB::transaction(function () use ($careNeed, $escalatedBy, $amountRequested) {
            $request = BenevolentRequest::create([
                'requester_name' => $careNeed->person_name,
                'requester_contact' => $careNeed->member?->phone ?? $careNeed->member?->email,
                'category' => $this->benevolentCategoryFor($careNeed->type),
                'description' => $careNeed->description ?: $careNeed->title,
                'amount_requested' => $amountRequested,
                'urgency' => $careNeed->priority->benevolentUrgency(),
                'status' => BenevolentStatus::Pending,
                'created_by' => $escalatedBy->id,
            ]);

            $careNeed->update(['benevolent_request_id' => $request->id]);
            $this->changeStatus($careNeed, CareNeedStatus::Escalated, $escalatedBy, 'Escalated to Benevolence for financial help.');

            return $request;
        });

        Log::info('Care need escalated to benevolence', [
            'care_need_id' => $careNeed->id,
            'benevolent_request_id' => $request->id,
            'escalated_by' => $escalatedBy->id,
        ]);

        return $request;
    }

    /**
     * Hand a need over to Counseling. The need is marked confidential because
     * counseling details must not be visible to the wider care team.
     */
    public function escalateToCounseling(CareNeed $careNeed, User $escalatedBy): CounselingCase
    {
        $case = DB::transaction(function () use ($careNeed, $escalatedBy) {
            $case = CounselingCase::create([
                'person_name' => $careNeed->person_name,
                'person_contact' => $careNeed->member?->phone,
                'person_email' => $careNeed->member?->email,
                'case_type' => $careNeed->type === CareNeedType::Bereavement ? CaseType::Grief : CaseType::Individual,
                'status' => CaseStatus::Open,
                'presenting_issue' => $careNeed->description ?: $careNeed->title,
                'referral_source' => 'Care Needs',
                'opened_by' => $escalatedBy->id,
                'opened_at' => now(),
            ]);

            $careNeed->update(['counseling_case_id' => $case->id, 'is_confidential' => true, 'share_on_prayer_wall' => false]);

            // Confidential needs are only visible to the assignee, creator, and admins,
            // so make sure whoever escalated it doesn't lose sight of it.
            if (! $careNeed->assigned_to) {
                $this->assign($careNeed, $escalatedBy, $escalatedBy);
            }
            $this->changeStatus($careNeed, CareNeedStatus::Escalated, $escalatedBy, 'Escalated to Counseling.');

            return $case;
        });

        Log::info('Care need escalated to counseling', [
            'care_need_id' => $careNeed->id,
            'counseling_case_id' => $case->id,
            'escalated_by' => $escalatedBy->id,
        ]);

        return $case;
    }

    public function addTask(CareNeed $careNeed, string $description, ?string $dueOn, User $createdBy): CareNeedTask
    {
        $task = $careNeed->tasks()->create([
            'description' => $description,
            'due_on' => $dueOn,
            'created_by' => $createdBy->id,
        ]);

        Log::info('Care task added', ['care_need_id' => $careNeed->id, 'task_id' => $task->id, 'created_by' => $createdBy->id]);

        return $task;
    }

    /**
     * Give a task to a volunteer (or take it back). Volunteers are told unless
     * they signed themselves up.
     */
    public function assignTask(CareNeedTask $task, ?User $volunteer, User $assignedBy): void
    {
        $task->update(['volunteer_id' => $volunteer?->id]);

        Log::info('Care task volunteer changed', [
            'task_id' => $task->id,
            'volunteer_id' => $volunteer?->id,
            'assigned_by' => $assignedBy->id,
        ]);

        if ($volunteer && $volunteer->id !== $assignedBy->id) {
            $volunteer->notify(new CareTaskAssigned($task));
        }
    }

    public function toggleTaskComplete(CareNeedTask $task, User $user): void
    {
        $task->update(['completed_at' => $task->isComplete() ? null : now()]);

        Log::info('Care task completion toggled', [
            'task_id' => $task->id,
            'completed' => $task->isComplete(),
            'user_id' => $user->id,
        ]);
    }

    /**
     * Record that someone prayed. Praying twice for the same request counts once.
     */
    public function pray(CareNeed $careNeed, User $user): bool
    {
        $prayer = CareNeedPrayer::firstOrCreate(['care_need_id' => $careNeed->id, 'user_id' => $user->id]);

        Log::info('Prayer recorded', [
            'care_need_id' => $careNeed->id,
            'user_id' => $user->id,
            'is_new' => $prayer->wasRecentlyCreated,
        ]);

        return $prayer->wasRecentlyCreated;
    }

    private function resolvedAtFor(CareNeedStatus $status): ?CarbonInterface
    {
        return in_array($status, [CareNeedStatus::Resolved, CareNeedStatus::Closed], true) ? now() : null;
    }

    private function notifyAssignee(CareNeed $careNeed): void
    {
        $careNeed->loadMissing('assignee');
        $careNeed->assignee?->notify(new CareNeedAssigned($careNeed));
    }

    /**
     * Confidential requests only go to admins; everything else goes to admins and staff.
     */
    private function notifyCareTeamOfRequest(CareNeed $careNeed): void
    {
        $roles = $careNeed->is_confidential ? [UserRole::Admin] : [UserRole::Admin, UserRole::Staff];
        $recipients = User::query()->whereIn('role', $roles)->get();

        Notification::send($recipients, new CareNeedRequested($careNeed));
    }

    private function benevolentCategoryFor(CareNeedType $type): BenevolentCategory
    {
        return match ($type) {
            CareNeedType::Meals => BenevolentCategory::Food,
            CareNeedType::Transportation => BenevolentCategory::Transportation,
            CareNeedType::HospitalVisit => BenevolentCategory::Medical,
            default => BenevolentCategory::Other,
        };
    }
}
