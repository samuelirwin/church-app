<?php

namespace App\Http\Requests\Admin;

use App\Enums\AttendanceSource;
use App\Models\MinistryGroup;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAttendanceSessionRequest extends FormRequest
{
    /**
     * Staff can open any session. Leaders can only open sessions for groups they lead.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user->isStaffOrAbove()) {
            return true;
        }

        return $user->isLeaderOrAbove()
            && $this->input('source') === AttendanceSource::Group->value
            && MinistryGroup::query()->whereKey($this->input('attendable_id'))->where('leader_id', $user->id)->exists();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $source = AttendanceSource::tryFrom((string) $this->input('source'));
        $table = $source ? (new ($source->modelClass()))->getTable() : null;

        return [
            'source' => ['required', Rule::enum(AttendanceSource::class)],
            'attendable_id' => ['required', 'integer', $table ? Rule::exists($table, 'id') : 'prohibited'],
            'occurred_on' => ['required', 'date', 'before_or_equal:'.now()->addDays(7)->toDateString()],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'source.required' => 'Choose what you are taking attendance for.',
            'attendable_id.required' => 'Choose a service, event, or group.',
            'attendable_id.exists' => 'The selected item does not exist.',
            'occurred_on.required' => 'Choose a date.',
            'occurred_on.before_or_equal' => 'Attendance can only be opened up to a week in advance.',
        ];
    }
}
