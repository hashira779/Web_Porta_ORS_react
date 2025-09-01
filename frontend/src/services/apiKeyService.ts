import  api  from '../api/api';
import { ApiKey } from '../types/apiKey';

/**
 * Fetches all API keys for the logged-in admin.
 */
export const getApiKeys = async (): Promise<ApiKey[]> => {
    // CORRECTED PATH: Removed '/api' prefix
    const response = await api.get('/admin/api-keys');
    return response.data;
};

/**
 * Creates a new API key with a specified name and scope.
 */
export const createApiKey = async (name: string, scope: string): Promise<ApiKey> => {
    // CORRECTED PATH: Removed '/api' prefix
    const response = await api.post('/admin/api-keys', { name, scope });
    return response.data;
};

/**
 * Toggles the active status of an API key.
 */
export const toggleApiKeyStatus = async (keyId: string): Promise<ApiKey> => {
    // CORRECTED PATH: Removed '/api' prefix
    const response = await api.patch(`/admin/api-keys/${keyId}/toggle-status`);
    return response.data;
};

/**
 * Updates the name of an API key.
 */
export const updateApiKeyName = async (keyId: string, name: string): Promise<ApiKey> => {
    // CORRECTED PATH: Removed '/api' prefix
    const response = await api.put(`/admin/api-keys/${keyId}`, { name });
    return response.data;
};

/**
 * Permanently deletes an API key.
 */
export const deleteApiKey = async (keyId: string): Promise<void> => {
    // CORRECTED PATH: Removed '/api' prefix
    await api.delete(`/admin/api-keys/${keyId}`);
};