export interface ApiKey {
    id: string;
    name: string | null; // Add name
    key: string;
    scope: string;
    is_active: boolean;
    created_at: string;
}