import axios from 'axios';
import authService from '../services/auth.service';
import { User } from '../types';

// Define a type for the dashboard filters for better type safety
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

// This function now accepts a filters object
export const getDashboardData = (filters: FilterParams = {}) => {
  // Clean up filters to only include active ones
  const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value) {
      acc[key as keyof FilterParams] = value;
    }
    return acc;
  }, {} as FilterParams);

  // Pass the cleaned filters as URL parameters
  return api.get('/dashboard/', { params: activeFilters });
};


// --- Admin API Functions ---

export const adminGetAllUsers = () => api.get<User[]>('/admin/users');

export const adminUpdateUser = (userId: number, userData: { role_id: number; is_active: boolean }) =>
    api.put(`/admin/users/${userId}`, userData);


export default api;