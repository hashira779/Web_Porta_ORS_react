// src/types/index.ts

// --- Core Models ---
export interface Permission {
    id: number;
    name: string;
    description: string | null;
}

export interface Role {
    id: number;
    name: string;
    description: string | null;
    permissions: Permission[];
}

export interface Area {
    id: number;
    name: string;
}

// CORRECTED: StationInfo now includes the 'owners' array
export interface StationInfo {
    id: number;
    station_ID: string;
    station_name: string;
    owners: User[]; // Each station object now knows its owners
}

export interface User {
    id: number;
    username: string;
    email: string;
    is_active: boolean;
    role: Role;
    managed_areas: Area[];
    owned_stations: StationInfo[];
}

// --- Detailed Models for Pages ---
export interface AreaDetail extends Area {
    stations: StationInfo[];
    managers: User[];
}

// --- API Payloads & Form Data ---
export interface UserFormData {
    id?: number;
    username: string;
    email: string;
    password?: string;
    role_id: number;
    is_active?: boolean;
}

export interface UserCreate extends Omit<UserFormData, 'id' | 'password' | 'is_active'> {
    password?: string;
}

export interface UserUpdate {
    email?: string;
    role_id?: number;
    is_active?: boolean;
}

export interface RoleUpdate {
    permission_ids: number[];
}

export interface RoleDetailsUpdate {
    name: string;
    description?: string | null;
}

export interface PermissionCreate {
    name: string;
    description?: string | null;
}

export interface AreaUpdate {
    name: string;
}


// --- Your Existing Types ---
export interface Sale {
    // These fields should match the columns in your `summary_station_*_materialized` tables
    ID_Type: string | null;
    STATION_ID: string | null;
    STATION: string | null;
    AM_Name: string | null;
    province_name: string | null;
    date_completed: string; // Dates will come as strings
    MAT_ID: string | null;
    PAYMENT: string | null;
    SHIFT_ID: number | null;
    total_valume: number; // Use number for calculations
    total_amount: number; // Use number for calculations
}
export interface StationSuggestion {
    station_ID: string;
    station_name: string;
}

export interface DecodedToken {
    sub: string;
    exp: number;
}
// --- NEW: Detailed Station model including its owners ---
export interface StationDetail extends StationInfo {
    owners: User[];
}

export interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

export interface ActiveUser {
    user_id: number;
    username: string;
    login_time: string;
}

export interface UserHistorySummary {
    user_id: number;
    username: string;
    session_count: number;
}

export interface SessionDetail {
    id: number;
    login_time: string;
    logout_time: string | null;
    ip_address: string | null;
    user_agent: string | null;
}

export interface UserHistoryResponse {
    username: string;
    history: SessionDetail[];
}