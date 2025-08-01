import axios from 'axios';
import { getMyProfile } from '../api/api';

const API_URL = "/api"; // Use relative URL for the proxy

// --- Login Function (No changes needed here) ---
const login = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const tokenResponse = await axios.post(API_URL + "/token", formData);

  if (tokenResponse.data.access_token) {
    localStorage.setItem("user", JSON.stringify(tokenResponse.data));
    const profileResponse = await getMyProfile();
    const fullUserData = { ...tokenResponse.data, ...profileResponse.data };
    localStorage.setItem("user", JSON.stringify(fullUserData));
    return fullUserData;
  }
};

// --- CORRECTED Logout Function ---
const logout = async () => {
  try {
    // Get the current user's token to send with the logout request
    const token = getCurrentUserToken();
    if (token) {
      // Step 1: Call the backend /logout endpoint
      await axios.post(API_URL + "/logout", {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
  } catch (error) {
    // Log the error but continue with logout process
    console.error("Logout API call failed:", error);
  } finally {
    // Step 2: Always remove user from local storage and redirect
    localStorage.removeItem("user");
    window.location.href = '/login';
  }
};

// --- Helper functions (No changes needed here) ---
const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) return JSON.parse(userStr);
  return null;
};

const getCurrentUserToken = (): string | null => {
  const user = getCurrentUser();
  return user?.access_token || null;
};

const authService = {
  login,
  logout,
  getCurrentUserToken,
  getCurrentUser,
};

export default authService;
