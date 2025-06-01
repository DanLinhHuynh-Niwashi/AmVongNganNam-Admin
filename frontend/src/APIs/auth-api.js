import axios from "axios";

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

export const signup = async (userData) => {
  return axios.post(`${API_URL}/signup`, userData);
};

export const login = async (credentials) => {
  const response = await axios.post(`${API_URL}/login`, credentials, { withCredentials: true });
  cache.clear();
  return response;
};

export const logout = async () => {
  const response = await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
  cache.clear();
  return response;
};

export const resetPassword = async (email) => {
  return axios.post(`${API_URL}/reset-password`, { email });
};

export const changePassword = async (passwordData) => {
  const response = await axios.post(`${API_URL}/change-password`, passwordData, { withCredentials: true });
  cache.clear();
  return response;
};

export const changeAccountInfo = async (accountData) => {
  const response = await axios.post(`${API_URL}/change-info`, accountData, { withCredentials: true });
  invalidateCache(["accountInfo"]);
  return response;
};

export const checkAuthStatus = async (forceRefresh = false) => {
  if (!forceRefresh) {
    const cached = getCache("authStatus");
    if (cached) return cached;
  }

  const response = await axios.get(`${API_URL}/me`, { withCredentials: true });
  setCache("authStatus", response);
  return response;
};

export const getAccountInfo = async (forceRefresh = false) => {
  if (!forceRefresh) {
    const cached = getCache("accountInfo");
    if (cached) return cached;
  }

  const response = await axios.get(`${API_URL}/account-info`, { withCredentials: true });
  setCache("accountInfo", response);
  return response;
};

export const deleteAccount = async () => {
  const response = await axios.delete(`${API_URL}/`, { withCredentials: true });
  cache.clear();
  return response;
};
