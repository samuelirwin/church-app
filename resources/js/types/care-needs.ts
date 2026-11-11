import type { Option } from '@/types/members';

export type CareNeed = {
    id: number;
    title: string;
    description: string | null;
    person_name: string;
    member_id: number | null;
    requester_name: string | null;
    type: string;
    type_label: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    priority_label: string;
    status: string;
    status_label: string;
    source_label: string;
    is_confidential: boolean;
    share_on_prayer_wall: boolean;
    assigned_to: number | null;
    assignee?: { id: number; name: string } | null;
    due_on: string | null;
    is_overdue: boolean;
    resolved_at: string | null;
    benevolent_request_id: number | null;
    counseling_case_id: number | null;
    tasks_count?: number;
    created_at: string;
};

export type CareNeedOptions = {
    types: Option[];
    priorities: Option[];
    statuses: Option[];
    contactMethods: Option[];
    careTeam: Array<{ id: number; name: string }>;
};

export const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export const careStatusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    in_progress:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    resolved:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    escalated:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};
