import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api/songs` 
  : `http://localhost:${process.env.REACT_APP_SERVER_PORT || 5000}/api/songs`;

/**
 * Upload a new song with files.
 */
export const uploadSongWithFiles = async (songData, files) => {
    try {
        const formData = new FormData();

        // Append song info
        Object.keys(songData).forEach((key) => {
            formData.append(key, songData[key]);
        });

        // Append files (ensure correct field name)
        if (files.audio) formData.append("audio", files.audio);
        if (files.easyMidi) formData.append("easyMidi", files.easyMidi);
        if (files.hardMidi) formData.append("hardMidi", files.hardMidi);

        // Debugging: Check formData
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        // Send request
        const response = await axios.post(`${API_URL}/upload`,  formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return response.data;
    } catch (error) {
        console.error("Error uploading song:", error);
        throw error;
    }
};


/**
 * Fetch all songs from the server.
 */
export const getAllSongs = async () => {
    try {
        const response = await axios.get(`${API_URL}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching songs:", error);
        throw error;
    }
};

/**
 * Fetch a single song by ID.
 */
export const getSongById = async (songId) => {
    try {
        const response = await axios.get(`${API_URL}/${songId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching song with ID ${songId}:`, error);
        throw error;
    }
};

/**
 * Update an existing song.
 */
export const updateSong = async (songId, songData, files = []) => {
    try {
        const formData = new FormData();

        Object.keys(songData).forEach((key) => {
            formData.append(key, songData[key]);
        });

        // Append files (ensure correct field name)
        if (files.audio) formData.append("audio", files.audio);
        if (files.easyMidi) formData.append("easyMidi", files.easyMidi);
        if (files.hardMidi) formData.append("hardMidi", files.hardMidi);

        // Debugging: Check formData
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }
        const response = await axios.put(`${API_URL}/${songId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return response.data;
    } catch (error) {
        console.error(`Error updating song with ID ${songId}:`, error);
        throw error;
    }
};
