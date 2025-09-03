import api  from '../api/api';
import { ApiKey, UserType, APIScope } from '../types/apiKey';

export const getAllUsers = async (): Promise<UserType[]> => {
    const response = await api.get('/admin/users-list');
    return response.data;
};

export const getApiKeys = async (): Promise<ApiKey[]> => {
    const response = await api.get('/admin/api-keys');
    return response.data;
};

export const createApiKey = async (name: string, scope: APIScope, userId?: number | null): Promise<ApiKey> => {
    const payload = { name, scope, user_id: userId };
    const response = await api.post('/admin/api-keys', payload);
    return response.data;
};

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