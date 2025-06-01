import mongoose from "mongoose";
import Grid from "gridfs-stream";
import multer from "multer";
import crypto from "crypto";
import { GridFsStorage } from "multer-gridfs-storage";
import Song from "../models/songModel.js";
import ScoreInfo from "../models/scoreInfoModel.js";
import dotenv from "dotenv";

dotenv.config();

const db = mongoose.connection;

let gfs, gridfsBucket;
db.once("open", () => {
    console.log("MongoDB connection open for GridFS");
    gridfsBucket = new mongoose.mongo.GridFSBucket(db, {
        bucketName: "uploads",
    });
    gfs = Grid(db, mongoose.mongo);
    gfs.collection("uploads");
});

const storage = new GridFsStorage({
    url: process.env.MONGO_URI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err) => {
                if (err) {
                    console.error("Error generating filename:", err);
                    return reject(err);
                }
                const filename = `${Date.now()}-${file.originalname}`;
                console.log(`File to be saved: ${filename}`);
                resolve({ filename, bucketName: "uploads" });
            });
        });
    },
});

storage.on("connection", () => console.log("GridFS storage is connected"));
storage.on("error", (err) => console.error("GridFS Storage Error:", err));

const upload = multer({ storage });

const deleteFile = async (fileUrl) => {
    try {
        if (!fileUrl) return;

        const filename = fileUrl.split("/uploads/")[1];
        if (!filename) return;

        const filesCollection = db.collection("uploads.files");
        const fileDoc = await filesCollection.findOne({ filename });

        if (!fileDoc) {
            console.warn(`File not found in GridFS: ${filename}`);
            return;
        }

        await gridfsBucket.delete(fileDoc._id);
        console.log(`Deleted file: ${filename}`);
    } catch (error) {
        console.error("Error deleting file:", error);
    }
};

export const createSongWithFiles = async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        console.log("Uploaded files:", req.files);

        const newSong = new Song({
            songName: req.body.songName,
            composer: req.body.composer,
            genre: req.body.genre,
            bpm: req.body.bpm,
            info: req.body.info,
            audioClip: req.files.audio ? `/uploads/${req.files.audio[0].filename}` : null,
            easyMidi: req.files.easyMidi ? `/uploads/${req.files.easyMidi[0].filename}` : null,
            hardMidi: req.files.hardMidi ? `/uploads/${req.files.hardMidi[0].filename}` : null,
        });

        await newSong.save();
        console.log("Song saved:", newSong);

        res.json({ message: "Files uploaded & song saved successfully", song: newSong });
    } catch (error) {
        console.error("Error saving song:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getAllSongs = async (req, res) => {
    try {
        console.log("Fetching all songs...");
        const songs = await Song.find();
        console.log(`Found ${songs.length} songs.`);
        res.status(200).json(songs);
    } catch (error) {
        console.error("Error fetching songs:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getSongById = async (req, res) => {
    try {
        console.log(`Fetching song with ID: ${req.params.id}`);
        const song = await Song.findById(req.params.id);
        if (!song) {
            console.warn(`Song not found: ${req.params.id}`);
            return res.status(404).json({ error: "Song not found" });
        }
        console.log(`Song found: ${song.songName}`);
        res.status(200).json(song);
    } catch (error) {
        console.error(`Error fetching song with ID ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
};

export const updateSong = async (req, res) => {
    try {
        const { id } = req.params;
        let song = await Song.findById(id);
        if (!song) {
            return res.status(404).json({ error: "Song not found" });
        }

        console.log("Updating song:", song.songName);

        if (req.files.audio) await deleteFile(song.audioClip);
        if (req.files.easyMidi) await deleteFile(song.easyMidi);
        if (req.files.hardMidi) await deleteFile(song.hardMidi);

        song.songName = req.body.songName || song.songName;
        song.composer = req.body.composer || song.composer;
        song.genre = req.body.genre || song.genre;
        song.bpm = req.body.bpm || song.bpm;
        song.info = req.body.info || song.info;
        if (req.files.audio) song.audioClip = `/uploads/${req.files.audio[0].filename}`;
        if (req.files.easyMidi) song.easyMidi = `/uploads/${req.files.easyMidi[0].filename}`;
        if (req.files.hardMidi) song.hardMidi = `/uploads/${req.files.hardMidi[0].filename}`;

        await song.save();
        console.log("Song updated:", song);

        res.json({ message: "Song updated successfully", song });
    } catch (error) {
        console.error("Error updating song:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteSong = async (req, res) => {
    try {
        const { id } = req.params;

        const song = await Song.findById(id);
        if (!song) {
            return res.status(404).json({ error: "Song not found" });
        }

        console.log(`Deleting song: ${song.songName}`);

        await deleteFile(song.audioClip);
        await deleteFile(song.easyMidi);
        await deleteFile(song.hardMidi);

        await Song.findByIdAndDelete(id);
        console.log("Song record deleted");

        const result = await ScoreInfo.deleteMany({ song_id: id });
        console.log(`Deleted ${result.deletedCount} score records`);

        res.json({ message: "Song, files, and related score data deleted successfully" });

    } catch (error) {
        console.error("Error deleting song:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const downloadFile = (req, res) => {
    const { filename } = req.params;
    const downloadStream = gridfsBucket.openDownloadStreamByName(filename);

    downloadStream.pipe(res);
    downloadStream.on("error", (err) => {
        console.error("Error downloading file:", err);
        res.status(404).json({ error: "File not found" });
    });
    downloadStream.on("finish", () => {
        console.log(`File ${filename} served successfully.`);
    });
};

export { upload };
