import type { Option } from '@/types/members';

export type VisitorFollowUp = {
    id: number;
    type: string;
    type_label: string;
    notes: string | null;
    followed_up_at: string;
    user: { id: number; name: string } | null;
};

export type Visitor = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    first_visit_date: string;
    how_heard: string | null;
    prayer_requests: string | null;
    notes: string | null;
    status: string;
    status_label: string;
    assigned_to: number | null;
    assigned_user?: { id: number; name: string } | null;
    converted_user?: { id: number; name: string } | null;
    follow_ups_count?: number;
    follow_ups?: VisitorFollowUp[];
};

/** The props the server sends for one visitor (see VisitorController::detail). */
export type VisitorDetailData = {
    visitor: { data: Visitor };
    users: Array<{ id: number; name: string }>;
    statuses: Option[];
    followUpTypes: Option[];
    isStaffOrAbove: boolean;
    canConvert: boolean;
};

export const visitorStatusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    contacted:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    follow_up:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    connected:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};
