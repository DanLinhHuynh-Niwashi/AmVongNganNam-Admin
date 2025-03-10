import React, { useState, useEffect } from "react";
import { uploadSongWithFiles, updateSong } from "./api.js";
import "./FileUpload.css";

const SongUploadForm = ({ selectedSong, onSongUpdated }) => {
    const [songData, setSongData] = useState({
        songName: "",
        composer: "",
        genre: "",
        bpm: "",
        info: "",
    });

    const [files, setFiles] = useState({ audio: null, easyMidi: null, hardMidi: null });
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (selectedSong) {
            setSongData({
                songName: selectedSong.songName || "",
                composer: selectedSong.composer || "",
                genre: selectedSong.genre || "",
                bpm: selectedSong.bpm || "",
                info: selectedSong.info || "",
            });
        } else {
            setSongData({ songName: "", composer: "", genre: "", bpm: "", info: "" });
            setFiles({ audio: null, easyMidi: null, hardMidi: null });
        }
    }, [selectedSong]);

    // Handle text field changes
    const handleChange = (e) => {
        setSongData({ ...songData, [e.target.name]: e.target.value });
    };

    // Handle file input changes
    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const extension = file.name.split('.').pop(); // Get file extension
            const newFileName = `${songData.songName || "song"}_${type}.${extension}`;
            const renamedFile = new File([file], newFileName, { type: file.type });

            setFiles({ ...files, [type]: renamedFile });
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);

        if (!songData.songName.trim()) {
            alert("Please enter a song name.");
            setIsUploading(false);
            return;
        }

        try {
            if (selectedSong) {
                await updateSong(selectedSong._id, songData, files);
                alert("✅ Song updated successfully!");
            } else {
                await uploadSongWithFiles(songData, files);
                alert("✅ Song uploaded successfully!");
            }

            setSongData({ songName: "", composer: "", genre: "", bpm: "", info: "" });
            setFiles({ audio: null, easyMidi: null, hardMidi: null });
        } catch (error) {
            console.error("Error:", error);
            alert("❌ Failed to process song.");
        }

        setIsUploading(false);
    };

    return (
        <div className="song-upload-container">
            <h2>{selectedSong ? "Edit Song" : "Upload a New Song"}</h2>
            <form className="song-upload-form" onSubmit={handleSubmit}>
                {selectedSong && (
                    <div>
                        <label>Song ID:</label>
                        <input type="text" value={selectedSong._id} disabled />
                    </div>
                )}

                <input type="text" name="songName" placeholder="Song Name" value={songData.songName} onChange={handleChange} required />
                <input type="text" name="composer" placeholder="Composer" value={songData.composer} onChange={handleChange} required />
                <input type="text" name="genre" placeholder="Genre" value={songData.genre} onChange={handleChange} required />
                <input type="number" name="bpm" placeholder="BPM" value={songData.bpm} onChange={handleChange} required />
                <textarea name="info" placeholder="Additional Info" value={songData.info} onChange={handleChange} />

                <div className="file-upload-section">
                    <label>Audio File:</label>
                    <input type="file" accept="audio/*" onChange={(e) => handleFileChange(e, "audio")} required={!selectedSong} />
                    {files.audio && <p>✅ {files.audio.name}</p>}

                    <label>Easy MIDI File:</label>
                    <input type="file" accept=".bytes" onChange={(e) => handleFileChange(e, "easyMidi")} required={!selectedSong} />
                    {files.easyMidi && <p>✅ {files.easyMidi.name}</p>}

                    <label>Hard MIDI File:</label>
                    <input type="file" accept=".bytes" onChange={(e) => handleFileChange(e, "hardMidi")} required={!selectedSong} />
                    {files.hardMidi && <p>✅ {files.hardMidi.name}</p>}
                </div>

                <button className="upload-button" type="submit" disabled={isUploading}>
                    {isUploading ? "Processing..." : selectedSong ? "Update Song" : "Upload Song"}
                </button>
            </form>
        </div>
    );
};

export default SongUploadForm;
