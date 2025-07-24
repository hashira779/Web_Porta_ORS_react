import axios from 'axios';
import { getMyProfile } from '../api/api'; // Ensure getMyProfile is imported from your api client

const API_URL = "/api"; // Use relative URL for the proxy

// --- Login Function ---
const login = async (username: string, password: string) => {
  // Step 1: Get the access token
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const tokenResponse = await axios.post(API_URL + "/token", formData);

  if (tokenResponse.data.access_token) {
    // Store the token immediately so the next API call is authenticated
    localStorage.setItem("user", JSON.stringify(tokenResponse.data));

    // Step 2: Use the token to fetch the user's full profile
    const profileResponse = await getMyProfile();

    // Combine the token and profile data into one object
    const fullUserData = {
      ...tokenResponse.data,
      ...profileResponse.data
    };

    // Now, store the complete user object in localStorage
    localStorage.setItem("user", JSON.stringify(fullUserData));

    return fullUserData;
  }
};

// --- Logout Function ---
const logout = () => {
  localStorage.removeItem("user");
  window.location.href = '/login';
};

// --- Function to get the full user object from storage ---
const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

// --- Function to get just the token from storage ---
const getCurrentUserToken = (): string | null => {
  const user = getCurrentUser();
  return user?.access_token || null;
};

// --- Export all functions ---
const authService = {
  login,
  logout,
  getCurrentUserToken,
  getCurrentUser,
};

export default authService;