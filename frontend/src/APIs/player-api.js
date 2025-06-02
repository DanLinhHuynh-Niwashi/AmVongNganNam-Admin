import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api/player`
  : `http://localhost:${process.env.REACT_APP_SERVER_PORT || 5000}/api/player`;

const axiosInstance = axios.create({
  withCredentials: true,
});

const cache = new Map();

const setCache = (key, value, ttl = 300000) => {
  const expires = Date.now() + ttl;
  cache.set(key, { value, expires });
};

export const clearCache = () => {
  cache.clear();
};

const getCache = (key) => {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  cache.delete(key);
  return null;
};

// Fetch all player accounts (cached 5 min)
export const getPlayerAccounts = async () => {
  const cacheKey = "playerAccounts";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await axiosInstance.get(`${API_URL}/players`);
    setCache(cacheKey, response);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getPlayerStatus = async (user_id) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/status/${user_id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getBanByUserId = async (userId) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/ban/${userId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const createBan = async (banData) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/ban`, banData);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateBan = async (banData) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/ban`, banData);
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteBan = async (banId) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/ban/${banId}`);
    return response;
  } catch (error) {
    throw error;
  }
};
