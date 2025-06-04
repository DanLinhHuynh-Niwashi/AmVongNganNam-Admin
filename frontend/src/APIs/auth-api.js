import axios from "axios";
import { clearCache as clearSongCache} from "./song-api";
import { clearCache as clearPlayerCache} from "./player-api";
const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api/auth`
  : `http://localhost:${process.env.REACT_APP_SERVER_PORT || 5000}/api/auth`;


const cache = new Map();

const setCache = (key, value, ttl = 300000) => {
  const expires = Date.now() + ttl;
  cache.set(key, { value, expires });
};

const getCache = (key) => {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  cache.delete(key);
  return null;
};

const invalidateCache = (keys = []) => {
  keys.forEach((key) => cache.delete(key));
};

const axiosInstance = axios.create({
  withCredentials: true
});

// Gắn interceptor để thêm Authorization từ sessionStorage (hoặc nơi khác)
axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const signup = async (userData) => {
  return axiosInstance.post(`${API_URL}/signup`, userData);
};

export const login = async (credentials) => {
  const response = await axiosInstance.post(`${API_URL}/login`, credentials);
  cache.clear();
  return response;
};

export const logout = async () => {
  const response = await axiosInstance.post(`${API_URL}/logout`, {});
  cache.clear();
  clearSongCache();
  sessionStorage.removeItem("authToken"); 
  clearPlayerCache();
  return response;
};

export const resetPassword = async (email) => {
  return axiosInstance.post(`${API_URL}/reset-password`, { email });
};

export const changePassword = async (passwordData) => {
  const response = await axiosInstance.post(`${API_URL}/change-password`, passwordData);
  cache.clear();
  return response;
};

export const changeAccountInfo = async (accountData) => {
  const response = await axiosInstance.post(`${API_URL}/change-info`, accountData);
  invalidateCache(["accountInfo"]);
  return response;
};

export const checkAuthStatus = async (forceRefresh = false) => {
  if (!forceRefresh) {
    const cached = getCache("authStatus");
    if (cached) return cached;
  }

  const response = await axiosInstance.get(`${API_URL}/me`);
  setCache("authStatus", response);
  return response;
};

export const getAccountInfo = async (forceRefresh = false) => {
  if (!forceRefresh) {
    const cached = getCache("accountInfo");
    if (cached) return cached;
  }

  const response = await axiosInstance.get(`${API_URL}/account-info`);
  setCache("accountInfo", response);
  return response;
};

export const deleteAccount = async () => {
  const response = await axiosInstance.delete(`${API_URL}/`);
  cache.clear();
  return response;
};