// Rename this interface to avoid conflict with the icon
export interface UserType {
    id: number;
    username: string;
}

interface KeyOwner {
    id: number;
    username: string;
}

export interface ApiKey {
    id: string;
    name: string | null;
    key: string;
    scope: string;
    is_active: boolean;
    created_at: string;
    owner: KeyOwner | null;
}