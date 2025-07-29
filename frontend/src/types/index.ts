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
    ID: number;
    MAT_ID: string | null;
    VALUE: number | null;
    UNIT_PRICE: number | null;
    AMOUNT: number | null;
    STATION_ID: string | null;
}

export interface DecodedToken {
    sub: string;
    exp: number;
}
// --- NEW: Detailed Station model including its owners ---
export interface StationDetail extends StationInfo {
    owners: User[];
}