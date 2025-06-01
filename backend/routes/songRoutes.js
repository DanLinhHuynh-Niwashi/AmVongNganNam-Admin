import express from "express";
import {
  downloadFile,
  upload,
  createSongWithFiles,
  getAllSongs,
  getSongById,
  updateSong,
  deleteSong
} from "../controllers/songServiceController.js";

import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js"; // Adjust path as needed

const songRoutes = express.Router();

songRoutes.get("/", getAllSongs);
songRoutes.get("/:id", getSongById);
songRoutes.get("/file/:filename", downloadFile);

songRoutes.post(
  "/upload",
  verifyToken,
  isAdmin,
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "easyMidi", maxCount: 1 },
    { name: "hardMidi", maxCount: 1 }
  ]),
  createSongWithFiles
);

songRoutes.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "easyMidi", maxCount: 1 },
    { name: "hardMidi", maxCount: 1 }
  ]),
  updateSong
);

songRoutes.delete("/:id", verifyToken, isAdmin, deleteSong);

export default songRoutes;
