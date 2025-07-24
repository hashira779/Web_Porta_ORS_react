import axios from 'axios';
import authService from '../services/auth.service';
import { User } from '../types';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = authService.getCurrentUserToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// --- API Functions ---
export const getSalesDataByYear = (year: string) => api.get(`/sales/${year}`);
export const getDashboardData = () => api.get('/dashboard/');
export const getAllUsers = () => api.get<User[]>('/users/');
export const updateUser = (userId: number, userData: { role_id: number; is_active: boolean }) => api.put(`/users/${userId}`, userData);

// Add this new function to fetch the current user's profile
export const getMyProfile = () => api.get<User>('/users/me');

export default api;