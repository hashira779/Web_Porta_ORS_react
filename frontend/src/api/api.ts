import axios from 'axios';
import authService from '../services/auth.service';
import {
  User,
  Role,
  Permission,
  AreaDetail,
  StationInfo,
  UserCreate,
  UserUpdate,
  RoleUpdate,
  RoleDetailsUpdate,
  PermissionCreate,
  Sale,
  AreaUpdate, StationSuggestion, UserHistorySummary, UserHistoryResponse, SendTelegramReportRequest, WebViewLink
} from '../types';

interface FilterParams {
  year?: string | number;
  month?: string | number;
  day?: string | number;
  id_type?: string;
}

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = authService.getCurrentUserToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
    (response) => {
      // If the response is successful, just return it.
      return response;
    },
    (error) => {
      // If the API returns an error...
      if (error.response && error.response.status === 401) {
        // Check if the error is a 401 Unauthorized error.
        console.log("Token expired or invalid. Logging out.");
        authService.logout(); // Clear the user's token from storage.
        window.location.href = '/login'; // Redirect to the login page.
      }

      // For all other errors, just pass them along.
      return Promise.reject(error);
    }
);

// --- General Functions ---
export const getMyProfile = () => api.get<User>('/users/me');

export const getSalesDataByYear = (year: string) => api.get<Sale[]>(`/reports/sales/${year}`);


export const getDashboardData = (filters: FilterParams = {}) => {
  const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v).map(([k, v]) => [k, String(v)]));
  return api.get('/dashboard/', { params });
};

// --- Admin Functions ---
export const adminGetAllUsers = () => api.get<User[]>('/admin/users');
export const adminCreateUser = (data: UserCreate) => api.post<User>('/admin/users', data);
export const adminUpdateUser = (userId: number, data: UserUpdate) => api.put<User>(`/admin/users/${userId}`, data);
export const adminDeleteUser = (userId: number) => api.delete(`/admin/users/${userId}`);

export const adminGetRoles = () => api.get<Role[]>('/admin/roles');
export const adminCreateRole = (data: { name: string; description?: string | null; }) => api.post<Role>('/admin/roles', data);
export const adminUpdateRole = (roleId: number, data: RoleDetailsUpdate) => api.put<Role>(`/admin/roles/${roleId}`, data);
export const adminUpdateRolePermissions = (roleId: number, data: RoleUpdate) => api.post<Role>(`/admin/roles/${roleId}/permissions`, data);
export const adminDeleteRole = (roleId: number) => api.delete(`/admin/roles/${roleId}`);

export const adminGetPermissions = () => api.get<Permission[]>('/admin/permissions');
export const adminCreatePermission = (data: PermissionCreate) => api.post<Permission>('/admin/permissions', data);
export const adminUpdatePermission = (permissionId: number, data: PermissionCreate) => api.put<Permission>(`/admin/permissions/${permissionId}`, data);
export const adminDeletePermission = (permissionId: number) => api.delete(`/admin/permissions/${permissionId}`);

// --- Area and Assignment Functions ---
export const adminGetAreaDetails = () => api.get<AreaDetail[]>('/admin/areas/details');
export const adminGetStations = (page: number = 1, limit: number = 20) => {
  return api.get<StationInfo[]>(`/admin/stations`, {
    params: { page, limit }
  });
};
export const adminCreateArea = (data: { name: string }) => api.post<AreaDetail>('/admin/areas', data);
export const adminUpdateArea = (areaId: number, data: AreaUpdate) => api.put<AreaDetail>(`/admin/areas/${areaId}`, data);
export const adminDeleteArea = (areaId: number) => api.delete(`/admin/areas/${areaId}`);
export const adminAssignManagersToArea = (areaId: number, managerIds: number[]) =>
    api.put<AreaDetail>(`/admin/assignments/areas/${areaId}/managers`, { manager_ids: managerIds });
export const adminAssignStationsToArea = (areaId: number, stationIds: number[]) =>
    api.put<AreaDetail>(`/admin/assignments/areas/${areaId}/stations`, { station_ids: stationIds });


export const adminAssignOwnersToStation = (stationId: number, ownerIds: number[]) =>
    api.put(`/admin/assignments/stations/${stationId}/owners`, { owner_ids: ownerIds });

// --- NEW: Function to assign stations to an owner ---
export const adminAssignStationsToOwner = (userId: number, stationIds: number[]) =>
    api.put<User>(`/admin/assignments/users/${userId}/stations`, { station_ids: stationIds });

//function for suggestion in report page
export const searchStations = (query: string) => {
  // Assuming you have a configured axios instance named 'api'
  return api.get<StationSuggestion[]>(`/stations/search?q=${query}`);
};

export const adminTerminateUserSessions = (userId: number) => api.post(`/admin/terminate-sessions/${userId}`);

export const adminGetUsersWithHistory = () => api.get<UserHistorySummary[]>(`/admin/sessions/history-summary`);

export const adminGetHistoryForUser = (userId: number) => api.get<UserHistoryResponse>(`/admin/sessions/history/${userId}`);

export const sendTelegramReport = (payload: SendTelegramReportRequest) =>
    api.post('/telegram/reports/send-telegram', payload);

// For the public viewer page (gets only active links)

export const getWebViewLinks = () => api.get<WebViewLink[]>('/webview-links');

// For the admin page (gets all links, active and inactive)
export const adminGetAllWebViewLinks = () => api.get<WebViewLink[]>('/webview-links/all');

// Create a new link
export const adminCreateWebViewLink = (data: { title: string; url: string; is_active: boolean }) =>
    api.post<WebViewLink>('/webview-links', data);

// CORRECTED: Update an existing link. The 'data' payload is now a Partial,
// meaning any of its properties can be provided.
export const adminUpdateWebViewLink = (linkId: number, data: Partial<Omit<WebViewLink, 'id'>>) =>
    api.put<WebViewLink>(`/webview-links/${linkId}`, data);

// Delete a link
export const adminDeleteWebViewLink = (linkId: number) =>
    api.delete(`/webview-links/${linkId}`);
export const adminUpdateAreaAssignments = (areaId: number, data: { manager_ids: number[], station_ids: number[] }) =>
    api.put<AreaDetail>(`/admin/assignments/areas/${areaId}`, data);

export default api;

