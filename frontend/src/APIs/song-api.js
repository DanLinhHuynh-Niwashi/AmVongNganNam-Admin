import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api/songs`
  : `http://localhost:${process.env.REACT_APP_SERVER_PORT || 5000}/api/songs`;

const axiosInstance = axios.create({
  withCredentials: true,
});

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

export const uploadSongWithFiles = async (songData, files) => {
  try {
    const formData = new FormData();
    Object.keys(songData).forEach((key) => {
      formData.append(key, songData[key]);
    });
    if (files.audio) formData.append("audio", files.audio);
    if (files.easyMidi) formData.append("easyMidi", files.easyMidi);
    if (files.hardMidi) formData.append("hardMidi", files.hardMidi);

    const response = await axiosInstance.post(`${API_URL}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    invalidateCache(["allSongs"]);

    return response.data;
  } catch (error) {
    console.error("Error uploading song:", error);
    throw error;
  }
};

export const getAllSongs = async () => {
  const cacheKey = "allSongs";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await axiosInstance.get(`${API_URL}`);
    setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching songs:", error);
    throw error;
  }
};

export const getSongById = async (songId) => {
  const cacheKey = `song_${songId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await axiosInstance.get(`${API_URL}/${songId}`);
    setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching song with ID ${songId}:`, error);
    throw error;
  }
};

export const updateSong = async (songId, songData, files = {}) => {
  try {
    const formData = new FormData();
    Object.keys(songData).forEach((key) => {
      formData.append(key, songData[key]);
    });
    if (files.audio) formData.append("audio", files.audio);
    if (files.easyMidi) formData.append("easyMidi", files.easyMidi);
    if (files.hardMidi) formData.append("hardMidi", files.hardMidi);

    const response = await axiosInstance.put(`${API_URL}/${songId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    invalidateCache(["allSongs", `song_${songId}`]);

    return response.data;
  } catch (error) {
    console.error(`Error updating song with ID ${songId}:`, error);
    throw error;
  }
};

export const deleteSong = async (songId) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/${songId}`);

    invalidateCache(["allSongs", `song_${songId}`]);

    return response.data;
  } catch (error) {
    console.error(`Error deleting song with ID ${songId}:`, error);
    throw error;
  }
};
