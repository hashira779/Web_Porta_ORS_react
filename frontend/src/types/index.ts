// src/types.ts

// Defines the shape of a Permission object
export interface Permission {
    id: number;
    name: string;
    description: string | null;
}

// Defines the shape of a Role, including its permissions
export interface Role {
    id: number;
    name: string;
    description: string | null;
    permissions: Permission[]; // A role can have many permissions
}

// Defines the shape of a User, including their full Role object
export interface User {
    id: number;
    username: string;
    email: string;
    is_active: boolean;
    role: Role; // A user has one role
}

// --- Other types ---

export interface Sale {
    ID: number;
    MAT_ID: string | null;
    VALUE: number | null;
    UNIT_PRICE: number | null;
    AMOUNT: number | null;
    STATION_ID: string | null;
}

export interface Station {
    id: number;
    station_id: string;
    station_name: string;
    Province: string;
    active: boolean;
}

export interface DecodedToken {
    sub: string;
    exp: number;
}
export interface UserFormData {
    id?: number;
    username: string;
    email: string;
    password?: string; // Password is optional, only used for creation
    role_id: number;
    is_active?: boolean;
}