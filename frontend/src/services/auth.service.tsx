import axios from 'axios';
import { getMyProfile } from '../api/api';

const API_URL = "/api"; // Use relative URL for the proxy

const login = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const tokenResponse = await axios.post(API_URL + "/token", formData);

  if (tokenResponse.data.access_token) {
    // Store only the token initially
    localStorage.setItem("authToken", tokenResponse.data.access_token);

    // Fetch the full user profile to get roles and permissions
    const profileResponse = await getMyProfile();

    // Combine token and profile into a single user object in local storage
    const user = {
      token: tokenResponse.data.access_token,
      ...profileResponse.data
    };
    localStorage.setItem("user", JSON.stringify(user));

    return user;
  }
};

// --- CORRECTED Logout Function ---
// The logout function should be simple: just clear local storage.
// The redirection will be handled by the application's routing logic.
const logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("authToken");
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) return JSON.parse(userStr);
  return null;
};

const getCurrentUserToken = (): string | null => {
  // Prefer the simple token storage for reliability
  return localStorage.getItem("authToken");
};

const authService = {
  login,
  logout,
  getCurrentUserToken,
  getCurrentUser,
};

export default authService;