import mongoose from "mongoose";
import Grid from "gridfs-stream";
import multer from "multer";
import crypto from "crypto";
import { GridFSBucket } from "mongodb";
import { GridFsStorage } from "multer-gridfs-storage";
import Song from "../models/songModel.js";
import dotenv from "dotenv";

dotenv.config();

console.log("Connecting to MongoDB...");
const conn = mongoose.createConnection(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

let gfs, gridfsBucket;
conn.once("open", () => {
    console.log("✅ MongoDB connected for GridFS!");
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: "uploads",
    });
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("uploads");
});

const storage = new GridFsStorage({
    url: process.env.MONGO_URI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    console.error("❌ Error generating filename:", err);
                    return reject(err);
                }
                const filename = `${Date.now()}-${file.originalname}`;
                
                console.log(`📂 File to be saved: ${filename}`);

                resolve({
                    filename,
                    bucketName: "uploads",
                });

                console.log("UPLOADED")
            });
        });
    },
});


storage.on("connection", () => console.log("✅ GridFS storage is connected"));
storage.on("error", (err) => console.error("❌ GridFS Storage Error:", err));

const upload = multer({ storage });

/**
 * 🔹 Upload song data and files
 */
export const createSongWithFiles = async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        console.log("📂 Uploaded files:", req.files);

        // Extract filenames from req.files
        const audioFile = req.files.audio ? req.files.audio[0].filename : null;
        const easyMidiFile = req.files.easyMidi ? req.files.easyMidi[0].filename : null;
        const hardMidiFile = req.files.hardMidi ? req.files.hardMidi[0].filename : null;

        // Create a new song document in MongoDB
        const newSong = new Song({
            songName: req.body.songName,
            composer: req.body.composer,
            genre: req.body.genre,
            bpm: req.body.bpm,
            info: req.body.info,
            audioClip: audioFile ? `/uploads/${audioFile}` : null,
            easyMidi: easyMidiFile ? `/uploads/${easyMidiFile}` : null,
            hardMidi: hardMidiFile ? `/uploads/${hardMidiFile}` : null,
        });

        await newSong.save();

        console.log("✅ Song saved:", newSong);

        res.json({
            message: "Files uploaded & song saved successfully",
            song: newSong,
        });
    } catch (error) {
        console.error("❌ Error saving song:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * 🔹 Get all songs
 */
export const getAllSongs = async (req, res) => {
    try {
        console.log("📡 Fetching all songs...");
        const songs = await Song.find();
        console.log(`✅ Found ${songs.length} songs.`);
        res.status(200).json(songs);
    } catch (error) {
        console.error("❌ Error fetching songs:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * 🔹 Get a single song by ID
 */
export const getSongById = async (req, res) => {
    try {
        console.log(`📡 Fetching song with ID: ${req.params.id}`);
        const song = await Song.findById(req.params.id);
        if (!song) {
            console.warn(`⚠️ Song not found: ${req.params.id}`);
            return res.status(404).json({ error: "Song not found" });
        }
        console.log(`✅ Song found: ${song.songName}`);
        res.status(200).json(song);
    } catch (error) {
        console.error(`❌ Error fetching song with ID ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * 🔹 Update an existing song
 */
export const updateSong = async (req, res) => {
    try {
        const { id } = req.params; // Get song ID from URL params

        // Check if song exists
        let song = await Song.findById(id);
        if (!song) {
            return res.status(404).json({ error: "Song not found" });
        }

        console.log("🎵 Updating song:", song.songName);

        // Helper function to delete old file from GridFS
        const deleteFile = async (fileUrl) => {
            if (!fileUrl) return;
            const filename = fileUrl.split("/uploads/")[1];
            const file = await conn.db.collection("uploads.files").findOne({ filename });

            if (file) {
                await gridfsBucket.delete(file._id);
                console.log(`🗑 Deleted old file: ${filename}`);
            }
        };

        // Extract new file names from req.files
        const audioFile = req.files.audio ? req.files.audio[0].filename : null;
        const easyMidiFile = req.files.easyMidi ? req.files.easyMidi[0].filename : null;
        const hardMidiFile = req.files.hardMidi ? req.files.hardMidi[0].filename : null;

        // Delete old files if new ones are uploaded
        if (audioFile) await deleteFile(song.audioClip);
        if (easyMidiFile) await deleteFile(song.easyMidi);
        if (hardMidiFile) await deleteFile(song.hardMidi);

        // Update song with new data
        song.songName = req.body.songName || song.songName;
        song.composer = req.body.composer || song.composer;
        song.genre = req.body.genre || song.genre;
        song.bpm = req.body.bpm || song.bpm;
        song.info = req.body.info || song.info;

        // Update file URLs only if new files are uploaded
        if (audioFile) song.audioClip = `/uploads/${audioFile}`;
        if (easyMidiFile) song.easyMidi = `/uploads/${easyMidiFile}`;
        if (hardMidiFile) song.hardMidi = `/uploads/${hardMidiFile}`;

        // Save updated song
        await song.save();

        console.log("✅ Song updated:", song);

        res.json({
            message: "Song updated successfully",
            song,
        });
    } catch (error) {
        console.error("❌ Error updating song:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const downloadFile = (req, res) => {
    const { filename } = req.params;
  
    // Create a read stream for the requested file from GridFS
    const downloadStream = gridfsBucket.openDownloadStreamByName(filename);
  
    // Pipe the file data to the response
    downloadStream.pipe(res);
  
    // Handle errors
    downloadStream.on('error', (err) => {
      console.error("Error downloading file:", err);
      res.status(404).json({ error: 'File not found' });
    });
  
    // Finish the download process
    downloadStream.on('finish', () => {
      console.log(`File ${filename} served successfully.`);
    });
  };

export { upload };
