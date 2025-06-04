import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import { FaTrashAlt } from "react-icons/fa";
import {
  getAllSongs,
  getSongById,
  uploadSongWithFiles,
  updateSong,
  deleteSong,
} from "../APIs/song-api.js";
import "./SongManager.css";

const BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}`
  : `http://localhost:${process.env.REACT_APP_SERVER_PORT || 5000}`;;

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
      alert("Tải bài hát thất bại.");
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
      alert("Lấy chi tiết bài hát thất bại.");
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
      alert("Nhập tên bài hát.");
      setIsUploading(false);
      return;
    }
    try {
      if (selectedSong) {
        await updateSong(selectedSong._id, songData, files);
        alert("Cập nhật bài hát thành công!");
      } else {
        await uploadSongWithFiles(songData, files);
        alert("Thêm bài hát thành công!");
      }
      clearSelection();
      fetchSongs();
    } catch (error) {
      console.error("Error:", error);
      alert("Xử lý thất bại: " + error.response.data.message);
    }
    setIsUploading(false);
  };

  const handleDelete = async (song) => {
    if (!window.confirm(`Bạn đang xóa bài hát "${song.songName}"?`))
      return;
    try {
      await deleteSong(song._id);
      alert("Xóa bài hát thành công!");
      clearSelection();
      fetchSongs();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Xóa bài hát thất bại: " + error.response.data.message);
    }
  };

  const downloadFromServer = async (filename) => {
    try {
      const response = await fetch(`${BASE_URL}/api/songs/file/${filename}`);
      if (!response.ok) throw new Error(response.message);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Không thể tải bài hát.");
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
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="song-manager">
      <h1>Quản lý Bài hát</h1>
      <div className="content">
      {/* Song List */}
      <div className="song-list">
        <h2>Danh sách Bài hát</h2>
        <div>
          <Button
            variant="outline-warning"
            className="mb-3"
            onClick={clearSelection}
            style={{ fontWeight: "600" }}
          >
            + Thêm Bài hát
          </Button>
        </div>
          <ul>
            {songs.length === 0 && <li>Không có bài hát nào</li>}
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
                  title="Xóa bài hát"
                  aria-label={`Xóa ${song.songName}`}
                >
                  <FaTrashAlt size={18} />
                </button>
              </li>
            ))}
          </ul>
      </div>

      {/* Song Upload/Edit Form */}
      <div className="song-form">
        <h2>{selectedSong ? "Chỉnh sửa bài hát" : "Thêm bài hát"}</h2>
        <Form onSubmit={handleSubmit}>
          {selectedSong && (
            <Form.Group className="mb-3" controlId="songId">
              <Form.Label>
                <strong>ID Bài hát:</strong>
              </Form.Label>
              <Form.Control type="text" value={selectedSong._id} disabled />
            </Form.Group>
          )}

          <Form.Group className="mb-3" controlId="songName">
            <Form.Control
              type="text"
              name="songName"
              placeholder="Tên bài hát"
              value={songData.songName}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="composer">
            <Form.Control
              type="text"
              name="composer"
              placeholder="Tác giả"
              value={songData.composer}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="genre">
            <Form.Control
              type="text"
              name="genre"
              placeholder="Thể loại"
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
              placeholder="Thông tin thêm"
              value={songData.info}
              onChange={handleChange}
              rows={4}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="isDefault">
            <Form.Check
              type="checkbox"
              label="Đây là bài hát mặc định"
              name="isDefault"
              checked={songData.isDefault}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="audioFile">
            <Row className="align-items-center">
              <Col xs="auto">
                <Form.Label>
                  <strong>Tệp âm thanh:</strong>
                </Form.Label>
              </Col>
              <Col>
                {audioPreview && (
                  <audio controls style={{ width: "100%", height: "30px" }}>
                    <source src={audioPreview} />
                    Trình duyệt không hỗ trợ tệp âm thanh.
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
                Tải tệp âm thanh
              </Button>
            )}
          </Form.Group>

          <Form.Group className="mb-3" controlId="easyMidiFile">
            <Form.Label>
              <strong>Tệp MIDI chế độ Dễ (.bytes):</strong>
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
                Tải tệp MIDI
              </Button>
            )}
          </Form.Group>

          <Form.Group className="mb-3" controlId="hardMidiFile">
            <Form.Label>
              <strong>Tệp MIDI chế độ Khó (.bytes):</strong>
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
                Tải tệp MIDI
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
              ? "Đang xử lý..."
              : selectedSong
              ? "Cập nhật bài hát"
              : "Thêm bài hát"}
          </Button>
        </Form>
      </div>
      </div>
    </div>
  );
};

export default SongManager;
