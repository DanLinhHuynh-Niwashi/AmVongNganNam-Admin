import express from "express";
import { downloadFile, upload, createSongWithFiles, getAllSongs, getSongById, updateSong } from "../controllers/songServiceController.js";

const songRoutes = express.Router();

songRoutes.post("/upload", upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "easyMidi", maxCount: 1 },
    { name: "hardMidi", maxCount: 1 }
]), createSongWithFiles);
songRoutes.get("/", getAllSongs);
songRoutes.get("/:id", getSongById);
songRoutes.put("/:id", upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "easyMidi", maxCount: 1 },
    { name: "hardMidi", maxCount: 1 }
]), updateSong);
songRoutes.get('/file/:filename', downloadFile);
export default songRoutes;
