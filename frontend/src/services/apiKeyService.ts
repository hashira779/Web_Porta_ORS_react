import  api  from '../api/api';
import { ApiKey, UserType } from '../types/apiKey'; // Import User type

// --- [NEW] Function to get all users ---
export const getAllUsers = async (): Promise<UserType[]> => {
    const response = await api.get('/admin/users-list');
    return response.data;
};

export const getApiKeys = async (): Promise<ApiKey[]> => {
    const response = await api.get('/admin/api-keys');
    return response.data;
};

// --- [MODIFIED] To accept an optional userId ---
export const createApiKey = async (name: string, scope: string, userId?: number | null): Promise<ApiKey> => {
    const payload = { name, scope, user_id: userId };
    const response = await api.post('/admin/api-keys', payload);
    return response.data;
};

// ... (rest of the service functions are unchanged)
export const toggleApiKeyStatus = async (keyId: string): Promise<ApiKey> => {
    const response = await api.patch(`/admin/api-keys/${keyId}/toggle-status`);
    return response.data;
};
export const updateApiKeyName = async (keyId: string, name: string): Promise<ApiKey> => {
    const response = await api.put(`/admin/api-keys/${keyId}`, { name });
    return response.data;
};
export const deleteApiKey = async (keyId: string): Promise<void> => {
    await api.delete(`/admin/api-keys/${keyId}`);
};