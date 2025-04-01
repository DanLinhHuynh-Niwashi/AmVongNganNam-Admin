import React, { useState, useEffect } from "react";
import { getAllSongs, getSongById } from "../APIs/song-api.js";

const SongList = ({ onSelectSong }) => {
    const [songs, setSongs] = useState([]);

    useEffect(() => {
        fetchSongs();
    }, []);

    // Fetch all songs
    const fetchSongs = async () => {
        try {
            const data = await getAllSongs();
            setSongs(data);
        } catch (error) {
            console.error("Error fetching songs:", error);
        }
    };

    // Fetch song details and pass them to parent component (SongForm)
    const handleSongClick = async (songId) => {
        try {
            const song = await getSongById(songId);
            onSelectSong(song);
        } catch (error) {
            console.error("Error fetching song details:", error);
        }
    };

    return (
        <div className="song-list-container">
            <h2>Song List</h2>
            <ul className="song-list">
                {songs.map((song) => (
                    <li key={song._id} onClick={() => handleSongClick(song._id)}>
                        <strong>{song.songName}</strong> - {song.composer}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SongList;
