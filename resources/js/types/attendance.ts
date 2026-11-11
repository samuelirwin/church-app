export type AttendanceSessionSummary = {
    id: number;
    title: string;
    source: 'service' | 'event' | 'group';
    source_label: string;
    occurred_on: string;
    guest_count: number;
    present_count: number;
};

export type RosterEntry = {
    id: number;
    full_name: string;
    household_id: number | null;
    household_name: string | null;
    age: number | null;
    status: 'present' | 'excused' | null;
    method: string | null;
};

export type AttendanceTotals = {
    present: number;
    excused: number;
    guests: number;
    total: number;
};

export type MemberAttendanceSummary = {
    services_held: number;
    services_attended: number;
    rate: number | null;
    recent: Array<{
        id: number;
        session_id: number;
        title: string;
        source: string;
        occurred_on: string;
        status: string;
        method: string;
    }>;
};
