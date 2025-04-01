import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL 
    ? `${process.env.REACT_APP_API_URL}/api/songs` 
    : `http://localhost:${process.env.REACT_APP_SERVER_PORT || 5000}/api/auth`; 

// Signup
export const signup = async (userData) => {
  return axios.post(`${API_URL}/signup`, userData);
};

// Login
export const login = async (credentials) => {
  return axios.post(`${API_URL}/login`, credentials, { withCredentials: true });
};

// Logout
export const logout = async () => {
  return axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
};

// Reset Password (Send email with reset link)
export const resetPassword = async (email) => {
  return axios.post(`${API_URL}/reset-password`, { email });
};

// Change Password
export const changePassword = async (passwordData) => {
  return axios.post(`${API_URL}/change-password`, passwordData, { withCredentials: true });
};

// Change Account Info (Update Name or Email)
export const changeAccountInfo = async (accountData) => {
  return axios.post(`${API_URL}/change-account-info`, accountData, { withCredentials: true });
};

// Check Authentication Status (Optional: Used to check if the user is logged in)
export const checkAuthStatus = async () => {
  return axios.get(`${API_URL}/me`, { withCredentials: true });
};
