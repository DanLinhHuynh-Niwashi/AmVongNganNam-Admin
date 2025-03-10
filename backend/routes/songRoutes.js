import express from "express";
import { downloadFile, upload, createSongWithFiles, getAllSongs, getSongById, updateSong } from "../controllers/songServiceController.js";

const router = express.Router();

router.post("/upload", upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "easyMidi", maxCount: 1 },
    { name: "hardMidi", maxCount: 1 }
]), createSongWithFiles);
router.get("/", getAllSongs);
router.get("/:id", getSongById);
router.put("/:id", upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "easyMidi", maxCount: 1 },
    { name: "hardMidi", maxCount: 1 }
]), updateSong);
router.get('/file/:filename', downloadFile);
export default router;
