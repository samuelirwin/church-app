<?php

namespace App\Http\Controllers\Admin;

use App\Exports\AttendanceSessionExport;
use App\Exports\BenevolentRequestsExport;
use App\Exports\BookLendingsExport;
use App\Exports\CounselingCasesExport;
use App\Exports\EventRegistrationsExport;
use App\Exports\FormResponsesExport;
use App\Exports\MembersExport;
use App\Exports\UsersExport;
use App\Exports\VisitorsExport;
use App\Http\Controllers\Controller;
use App\Models\AttendanceSession;
use App\Models\Event;
use App\Models\Form;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportController extends Controller
{
    public function users(Request $request): BinaryFileResponse|Response
    {
        Log::info('Users export initiated', ['format' => $request->input('format', 'csv'), 'user_id' => $request->user()->id]);

        if ($request->input('format') === 'pdf') {
            $users = \App\Models\User::orderBy('name')->get();
            $pdf = Pdf::loadView('exports.users-report', ['users' => $users]);

            return $pdf->download('users-report.pdf');
        }

        return Excel::download(new UsersExport, 'users.csv');
    }

    public function eventRegistrations(Request $request, Event $event): BinaryFileResponse|Response
    {
        Log::info('Event registrations export initiated', [
            'event_id' => $event->id,
            'format' => $request->input('format', 'csv'),
            'user_id' => $request->user()->id,
        ]);

        if ($request->input('format') === 'pdf') {
            $registrations = $event->registrations()->orderBy('registered_at')->get();
            $pdf = Pdf::loadView('exports.event-registrations-report', [
                'event' => $event,
                'registrations' => $registrations,
            ]);

            return $pdf->download("event-{$event->id}-registrations.pdf");
        }

        return Excel::download(new EventRegistrationsExport($event), "event-{$event->id}-registrations.csv");
    }

    public function formResponses(Request $request, Form $form): BinaryFileResponse
    {
        Log::info('Form responses export initiated', [
            'form_id' => $form->id,
            'format' => $request->input('format', 'csv'),
            'user_id' => $request->user()->id,
        ]);

        return Excel::download(new FormResponsesExport($form), "form-{$form->id}-responses.csv");
    }

    public function visitors(Request $request): BinaryFileResponse|Response
    {
        Log::info('Visitors export initiated', ['format' => $request->input('format', 'csv'), 'user_id' => $request->user()->id]);

        if ($request->input('format') === 'pdf') {
            $visitors = \App\Models\Visitor::orderBy('created_at', 'desc')->get();
            $pdf = Pdf::loadView('exports.visitors-report', ['visitors' => $visitors]);

            return $pdf->download('visitors-report.pdf');
        }

        return Excel::download(new VisitorsExport, 'visitors.csv');
    }

    public function members(Request $request): BinaryFileResponse|Response
    {
        Log::info('Members export initiated', ['format' => $request->input('format', 'csv'), 'user_id' => $request->user()->id]);

        if ($request->input('format') === 'pdf') {
            $members = (new MembersExport)->query()->get();
            $pdf = Pdf::loadView('exports.members-report', ['members' => $members]);

            return $pdf->download('members-report.pdf');
        }

        return Excel::download(new MembersExport, 'members.csv');
    }

    public function attendanceSession(Request $request, AttendanceSession $attendanceSession): BinaryFileResponse
    {
        Log::info('Attendance session export initiated', [
            'session_id' => $attendanceSession->id,
            'user_id' => $request->user()->id,
        ]);

        return Excel::download(
            new AttendanceSessionExport($attendanceSession),
            "attendance-{$attendanceSession->occurred_on->toDateString()}-{$attendanceSession->id}.csv",
        );
    }

    public function bookLendings(Request $request): BinaryFileResponse
    {
        Log::info('Book lendings export initiated', ['format' => $request->input('format', 'csv'), 'user_id' => $request->user()->id]);

        return Excel::download(new BookLendingsExport, 'book-lendings.csv');
    }

    public function benevolentRequests(Request $request): BinaryFileResponse|Response
    {
        Log::info('Benevolent requests export initiated', ['format' => $request->input('format', 'csv'), 'user_id' => $request->user()->id]);

        if ($request->input('format') === 'pdf') {
            $requests = \App\Models\BenevolentRequest::with('creator')->orderBy('created_at', 'desc')->get();
            $pdf = Pdf::loadView('exports.benevolence-report', ['requests' => $requests]);

            return $pdf->download('benevolence-report.pdf');
        }

        return Excel::download(new BenevolentRequestsExport, 'benevolent-requests.csv');
    }

    public function counselingCases(Request $request): BinaryFileResponse
    {
        Log::info('Counseling cases export initiated (redacted)', [
            'format' => $request->input('format', 'csv'),
            'user_id' => $request->user()->id,
        ]);

        return Excel::download(new CounselingCasesExport, 'counseling-cases.csv');
    }
}
