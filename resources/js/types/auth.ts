export type UserRole = 'admin' | 'staff' | 'leader' | 'member';

export type User = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    avatar_url?: string | null;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type Permissions = {
    isAdmin: boolean;
    isStaffOrAbove: boolean;
    isLeaderOrAbove: boolean;
    isDeacon: boolean;
    isCounselor: boolean;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
