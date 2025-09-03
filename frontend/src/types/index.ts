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

export interface StationInfo {
    id: number;
    station_id: string;
    station_name: string;
    owners: User[];
}

export interface User {
    id: number;
    username: string;
    email: string;
    is_active: boolean;
    role: Role;
    user_id: string | null;
    managed_areas: Area[];
    owned_stations: StationInfo[];
}

// --- Detailed Models for Pages ---
export interface AreaDetail extends Area {
    stations: StationInfo[];
    managers: User[];
}

export interface StationDetail extends StationInfo {
    owners: User[];
}

// --- API Payloads & Form Data ---
export interface UserFormData {
    id?: number;
    user_id: string | null;
    username: string;
    email: string;
    password?: string;
    role_id: number;
    is_active?: boolean;
}

// --- SIMPLIFIED ---
export interface UserCreate {
    username: string;
    email: string;
    password?: string;
    role_id: number;
    user_id: string | null;
    is_active?: boolean;
}

export interface UserUpdate {
    username?: string;
    email?: string;
    user_id?: string | null;
    role_id?: number;
    is_active?: boolean;
    password?: string;
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

// --- Session Management ---
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

// --- Other ---
export interface DecodedToken {
    sub: string;
    exp: number;
}

export interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

export interface SendTelegramReportRequest {
    start_date: string;
    end_date: string;
    roles: string[];
}

export interface WebViewLink {
    id: number;
    title: string;
    url: string;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
}

export interface StationSuggestion {
    station_id: string;
    station_name: string;
}

export interface Sale {
    ID_Type: string | null;
    STATION_ID: string | null;
    STATION: string | null;
    AM_Name: string | null;
    province_name: string | null;
    date_completed: string;
    MAT_ID: string | null;
    PAYMENT: string | null;
    SHIFT_ID: number | null;
    MAT_Name: string | null;
    total_valume: number;
    total_amount: number;
}

export interface IStationInfo {
    id: number;
    station_id: string;
    station_name: string;     // FIX: The property is 'Province' (capital P)
    active?: number | null;

    // FIX: These are now nested objects, not just IDs
    am_control?: IAMControl | null;
    supporter?: ISupporter | null;
    province?: IProvince | null;

    // We still need the IDs for the form dropdowns
    am_control_id?: number | null;
    supporter_id?: number | null;
    province_id?: string | null;

    // Other fields from your model
    AM_Control?: string | null;
    Operating?: number | null;
    FleetCardStatus?: number | null;
    POSUsing?: number | null;
    area_id?: number | null;
}
export interface IAMControl {
    id: number;
    name: string;
}

export interface ISupporter {
    id: number;
    supporter_name: string;
}

export interface IProvince {
    id: string;
    name: string;
}