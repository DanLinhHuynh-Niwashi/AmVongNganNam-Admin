import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import { FaTrashAlt } from "react-icons/fa";
import {
  getAllSongs,
  getSongById,
  uploadSongWithFiles,
  updateSong,
  deleteSong, // <-- Make sure to implement this API call
} from "../APIs/song-api.js";
import "./SongManager.css";

const BASE_URL = "http://localhost:5000";

const extractFilename = (path) => path?.split("/uploads/")[1];

const SongManager = () => {
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [songData, setSongData] = useState({
    songName: "",
    composer: "",
    genre: "",
    bpm: "",
    info: "",
    isDefault: false
  });
  const [files, setFiles] = useState({
    audio: null,
    easyMidi: null,
    hardMidi: null,
  });
  const [audioPreview, setAudioPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const data = await getAllSongs();
      setSongs(data);
    } catch (error) {
      console.error("Error fetching songs:", error);
      alert("Failed to load songs.");
    } finally {
      setLoading(false);
    }
  };

  const handleSongClick = async (songId) => {
    try {
      const song = await getSongById(songId);
      console.log(song)
      setSelectedSong(song);
      setSongData({
        songName: song.songName || "",
        composer: song.composer || "",
        genre: song.genre || "",
        bpm: song.bpm || "",
        info: song.info || "",
        isDefault: song.isDefault || false
      });
      setFiles({ audio: null, easyMidi: null, hardMidi: null });
      if (song.audioClip) {
        const audioUrl = `${BASE_URL}/api/songs/file/${extractFilename(
          song.audioClip
        )}`;
        setAudioPreview(audioUrl);
      } else {
        setAudioPreview(null);
      }
    } catch (error) {
      console.error("Error fetching song details:", error);
      alert("Failed to load song details.");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSongData({ ...songData, [name]: type === "checkbox" ? checked : value });
  };


  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const extension = file.name.split(".").pop();
      const newFileName = `${songData.songName || "song"}_${type}.${extension}`;
      const renamedFile = new File([file], newFileName, { type: file.type });
      setFiles({ ...files, [type]: renamedFile });
      if (type === "audio") {
        setAudioPreview(URL.createObjectURL(renamedFile));
      }
    }
  };

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
        alert("Song updated successfully!");
      } else {
        await uploadSongWithFiles(songData, files);
        alert("Song uploaded successfully!");
      }
      clearSelection();
      fetchSongs();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to process song: " + error.response.data.message);
    }
    setIsUploading(false);
  };

  const handleDelete = async (song) => {
    if (!window.confirm(`Are you sure you want to delete "${song.songName}"?`))
      return;
    try {
      await deleteSong(song._id);
      alert("Song deleted successfully!");
      clearSelection();
      fetchSongs();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete song: " + error.response.data.message);
    }
  };

  const downloadFromServer = async (filename) => {
    try {
      const response = await fetch(`${BASE_URL}/api/songs/file/${filename}`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Could not download file.");
    }
  };

  const clearSelection = () => {
    setSelectedSong(null);
    setSongData({ songName: "", composer: "", genre: "", bpm: "", info: "", isDefault: false });
    setFiles({ audio: null, easyMidi: null, hardMidi: null });
    setAudioPreview(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="song-manager">
      <h1>Song Manager</h1>
      <div className="content">
      {/* Song List */}
      <div className="song-list">
        <h2>Song List</h2>
        <div>
          <Button
            variant="outline-warning"
            className="mb-3"
            onClick={clearSelection}
            style={{ fontWeight: "600" }}
          >
            + Upload New Song
          </Button>
        </div>
          <ul>
            {songs.length === 0 && <li>No songs found</li>}
            {songs.map((song) => (
              <li
                key={song._id}
                onClick={() => handleSongClick(song._id)}
                className={`song-list-item ${
                  selectedSong?._id === song._id ? "selected" : ""
                }`}
                title={`${song.songName} by ${song.composer}`}
              >
                <span className="song-info">
                  <strong>{song.songName}</strong> - {song.composer}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(song);
                  }}
                  className="delete-btn"
                  title="Delete Song"
                  aria-label={`Delete ${song.songName}`}
                >
                  <FaTrashAlt size={18} />
                </button>
              </li>
            ))}
          </ul>
      </div>

      {/* Song Upload/Edit Form */}
      <div className="song-form">
        <h2>{selectedSong ? "Edit Song" : "Upload a New Song"}</h2>
        <Form onSubmit={handleSubmit}>
          {selectedSong && (
            <Form.Group className="mb-3" controlId="songId">
              <Form.Label>
                <strong>Song ID:</strong>
              </Form.Label>
              <Form.Control type="text" value={selectedSong._id} disabled />
            </Form.Group>
          )}

          <Form.Group className="mb-3" controlId="songName">
            <Form.Control
              type="text"
              name="songName"
              placeholder="Song Name"
              value={songData.songName}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="composer">
            <Form.Control
              type="text"
              name="composer"
              placeholder="Composer"
              value={songData.composer}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="genre">
            <Form.Control
              type="text"
              name="genre"
              placeholder="Genre"
              value={songData.genre}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="bpm">
            <Form.Control
              type="number"
              name="bpm"
              placeholder="BPM"
              value={songData.bpm}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="info">
            <Form.Control
              as="textarea"
              name="info"
              placeholder="Additional Info"
              value={songData.info}
              onChange={handleChange}
              rows={4}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="isDefault">
            <Form.Check
              type="checkbox"
              label="Mark as Default Song"
              name="isDefault"
              checked={songData.isDefault}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="audioFile">
            <Row className="align-items-center">
              <Col xs="auto">
                <Form.Label>
                  <strong>Audio File:</strong>
                </Form.Label>
              </Col>
              <Col>
                {audioPreview && (
                  <audio controls style={{ width: "100%", height: "30px" }}>
                    <source src={audioPreview} />
                    Your browser does not support the audio element.
                  </audio>
                )}
              </Col>
            </Row>
            <Form.Control
              type="file"
              accept="audio/*"
              onChange={(e) => handleFileChange(e, "audio")}
              required={!selectedSong}
            />
            {files.audio && <p>{files.audio.name}</p>}
            {!files.audio && selectedSong?.audioClip && (
              <Button
                variant="warning"
                size="sm"
                className="mt-2"
                onClick={() =>
                  downloadFromServer(extractFilename(selectedSong.audioClip))
                }
              >
                Download Audio File
              </Button>
            )}
          </Form.Group>

          <Form.Group className="mb-3" controlId="easyMidiFile">
            <Form.Label>
              <strong>Easy MIDI File (.bytes):</strong>
            </Form.Label>
            <Form.Control
              type="file"
              accept=".bytes"
              onChange={(e) => handleFileChange(e, "easyMidi")}
              required={!selectedSong}
            />
            {files.easyMidi && <p>{files.easyMidi.name}</p>}
            {!files.easyMidi && selectedSong?.easyMidi && (
              <Button
                variant="warning"
                size="sm"
                className="mt-2"
                onClick={() =>
                  downloadFromServer(extractFilename(selectedSong.easyMidi))
                }
              >
                Download Easy MIDI
              </Button>
            )}
          </Form.Group>

          <Form.Group className="mb-3" controlId="hardMidiFile">
            <Form.Label>
              <strong>Hard MIDI File (.bytes):</strong>
            </Form.Label>
            <Form.Control
              type="file"
              accept=".bytes"
              onChange={(e) => handleFileChange(e, "hardMidi")}
              required={!selectedSong}
            />
            {files.hardMidi && <p>{files.hardMidi.name}</p>}
            {!files.hardMidi && selectedSong?.hardMidi && (
              <Button
                variant="warning"
                size="sm"
                className="mt-2"
                onClick={() =>
                  downloadFromServer(extractFilename(selectedSong.hardMidi))
                }
              >
                Download Hard MIDI
              </Button>
            )}
          </Form.Group>

          <Button
            type="submit"
            variant="warning"
            disabled={isUploading}
            style={{ fontWeight: "700", fontSize: "1.1rem" }}
          >
            {isUploading
              ? "Processing..."
              : selectedSong
              ? "Update Song"
              : "Upload Song"}
          </Button>
        </Form>
      </div>
      </div>
    </div>
  );
};

export default SongManager;
