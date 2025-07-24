// Add a new interface for the Role object
export interface Role {
    id: number;
    name: string;
    description?: string; // Description is optional
}

// Update your User interface to include the nested Role
export interface User {
    id: number;
    username: string;
    email: string;
    is_active: boolean;
    role_id: number; // Keep this for when you need to send just the ID
    role: Role;      // **This is the missing property**
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