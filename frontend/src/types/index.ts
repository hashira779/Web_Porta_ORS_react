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

export interface User {
    id: number;
    username: string;
    email: string;
    role_id: number;
    is_active: boolean;
}

export interface DecodedToken {
    sub: string;
    exp: number;
}

// This line fixes the error by ensuring the file is treated as a module.
export {};