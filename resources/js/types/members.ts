export type Option = { value: string; label: string };

export type PaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

export type Paginated<T> = { data: T[]; meta: PaginationMeta };

export type StatusChange = {
    id: number;
    from_label: string | null;
    to_label: string;
    reason: string | null;
    changed_by: string | null;
    created_at: string;
};

export type Member = {
    id: number;
    user_id: number | null;
    first_name: string;
    last_name: string | null;
    preferred_name: string | null;
    full_name: string;
    email: string | null;
    phone: string | null;
    date_of_birth: string | null;
    age: number | null;
    gender: string | null;
    gender_label: string | null;
    marital_status: string | null;
    marital_status_label: string | null;
    household_id: number | null;
    household_role: string | null;
    household_role_label: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    membership_status: string;
    membership_status_label: string;
    joined_at: string | null;
    baptized_at: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    notes?: string | null;
    photo_url: string | null;
    household?: { id: number; name: string } | null;
    user?: { id: number; name: string; role: string } | null;
    status_changes?: StatusChange[];
    deleted_at: string | null;
};

export type Household = {
    id: number;
    name: string;
    phone: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    notes: string | null;
    members_count?: number;
    head?: { id: number; full_name: string } | null;
    members?: Member[];
};

/** Badge colours for each membership status, shared by every members page. */
export const membershipStatusColors: Record<string, string> = {
    visitor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    regular: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
    member: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    inactive:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    transferred:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    deceased: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};
