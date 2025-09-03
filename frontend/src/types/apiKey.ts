// Enum to define all possible valid scopes
export enum APIScope {
    ExternalSales = "external_sales",
    AMSalesReport = "am_sales_report",
    AMSummaryReport = "am_summary_report",
}

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
    scope: APIScope; // Use the Enum for type safety
    is_active: boolean;
    created_at: string;
    owner: KeyOwner | null;
}