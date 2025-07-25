import axios from 'axios';
import authService from '../services/auth.service';
import { User, Role, Permission } from '../types';

// Define a type for the dashboard filters
interface FilterParams {
  year?: string | number;
  month?: string | number;
  day?: string | number;
  id_type?: string;
}

const api = axios.create({
  baseURL: '/api',
});

// Attaches the JWT token to every outgoing request
api.interceptors.request.use((config) => {
  const token = authService.getCurrentUserToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));


// --- General API Functions ---

export const getMyProfile = () => api.get<User>('/users/me');

export const getSalesDataByYear = (year: string) => api.get(`/sales/${year}`);

export const getDashboardData = (filters: FilterParams = {}) => {
  const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value) {
      acc[key as keyof FilterParams] = value;
    }
    return acc;
  }, {} as FilterParams);
  return api.get('/dashboard/', { params: activeFilters });
};

// / --- Admin API Functions ---
export const adminGetAllUsers = () => api.get<User[]>('/admin/users');
export const adminCreateUser = (data: any) => api.post<User>('/admin/users', data);
export const adminUpdateUser = (userId: number, data: any) => api.put<User>(`/admin/users/${userId}`, data);
export const adminDeleteUser = (userId: number) => api.delete(`/admin/users/${userId}`);

export const adminGetRoles = () => api.get<Role[]>('/admin/roles');
export const adminGetPermissions = () => api.get<Permission[]>('/admin/permissions');
// --- THIS LINE HAS BEEN FIXED ---
export const adminCreateRole = (data: { name: string; description?: string | null; permission_ids: number[] }) => api.post<Role>('/admin/roles', data);
// --- END FIXED LINE ---
export const adminUpdateRole = (roleId: number, data: { name: string; description?: string | null; permission_ids: number[] }) => api.put<Role>(`/admin/roles/${roleId}`, data);
export const adminDeleteRole = (roleId: number) => api.delete(`/admin/roles/${roleId}`);
export const adminCreatePermission = (data: { name: string; description?: string | null }) => api.post<Permission>('/admin/permissions', data);
export const adminUpdatePermission = (permissionId: number, data: { name: string; description?: string | null }) => api.put<Permission>(`/admin/permissions/${permissionId}`, data);
export const adminDeletePermission = (permissionId: number) => api.delete(`/admin/permissions/${permissionId}`);

export default api;