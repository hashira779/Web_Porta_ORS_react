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
  AreaUpdate
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

// --- General Functions ---
export const getMyProfile = () => api.get<User>('/users/me');
export const getSalesDataByYear = (year: string) => api.get<Sale[]>(`/sales/${year}`);
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
export const adminGetStations = () => api.get<StationInfo[]>('/admin/stations');
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


export default api;