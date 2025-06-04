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
    console.log("Đã kết nối MongoDB để sử dụng GridFS");
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
                    console.error("Lỗi khi tạo tên tệp ngẫu nhiên:", err);
                    return reject(err);
                }
                const filename = `${Date.now()}-${file.originalname}`;
                console.log(`Tệp sẽ được lưu: ${filename}`);
                resolve({ filename, bucketName: "uploads" });
            });
        });
    },
});

storage.on("connection", () => console.log("Đã kết nối với GridFS Storage"));
storage.on("error", (err) => console.error("Lỗi GridFS Storage:", err));

const upload = multer({ storage });

const deleteFile = async (fileUrl) => {
    try {
        if (!fileUrl) return;

        const filename = fileUrl.split("/uploads/")[1];
        if (!filename) return;

        const filesCollection = db.collection("uploads.files");
        const fileDoc = await filesCollection.findOne({ filename });

        if (!fileDoc) {
            console.warn(`Không tìm thấy tệp trong GridFS: ${filename}`);
            return;
        }

        await gridfsBucket.delete(fileDoc._id);
        console.log(`Đã xóa tệp: ${filename}`);
    } catch (error) {
        console.error("Lỗi khi xóa tệp:", error);
    }
};

export const createSongWithFiles = async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ error: "Không có tệp nào được tải lên" });
        }

        console.log("Các tệp đã được tải lên:", req.files);

        const newSong = new Song({
            songName: req.body.songName,
            composer: req.body.composer,
            genre: req.body.genre,
            bpm: req.body.bpm,
            info: req.body.info,
            audioClip: req.files.audio ? `/uploads/${req.files.audio[0].filename}` : null,
            easyMidi: req.files.easyMidi ? `/uploads/${req.files.easyMidi[0].filename}` : null,
            hardMidi: req.files.hardMidi ? `/uploads/${req.files.hardMidi[0].filename}` : null,
            isDefault: req.body.isDefault
        });

        await newSong.save();
        console.log("Đã lưu bài hát:", newSong);

        res.json({ message: "Tệp đã được tải lên và bài hát được lưu thành công", song: newSong });
    } catch (error) {
        console.error("Lỗi khi lưu bài hát:", error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const getAllSongs = async (req, res) => {
    try {
        console.log("Đang lấy tất cả bài hát...");
        const songs = await Song.find();
        console.log(`Đã tìm thấy ${songs.length} bài hát.`);
        res.status(200).json(songs);
    } catch (error) {
        console.error("Lỗi khi lấy bài hát:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getSongById = async (req, res) => {
    try {
        console.log(`Đang lấy bài hát với ID: ${req.params.id}`);
        const song = await Song.findById(req.params.id);
        if (!song) {
            console.warn(`Không tìm thấy bài hát: ${req.params.id}`);
            return res.status(404).json({ error: "Không tìm thấy bài hát" });
        }
        console.log(`Đã tìm thấy bài hát: ${song.songName}`);
        res.status(200).json(song);
    } catch (error) {
        console.error(`Lỗi khi lấy bài hát với ID ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
};

export const updateSong = async (req, res) => {
    try {
        const { id } = req.params;
        let song = await Song.findById(id);
        if (!song) {
            return res.status(404).json({ error: "Không tìm thấy bài hát" });
        }

        console.log("Đang cập nhật bài hát:", song.songName);

        if (req.files.audio) await deleteFile(song.audioClip);
        if (req.files.easyMidi) await deleteFile(song.easyMidi);
        if (req.files.hardMidi) await deleteFile(song.hardMidi);

        song.songName = req.body.songName || song.songName;
        song.composer = req.body.composer || song.composer;
        song.genre = req.body.genre || song.genre;
        song.bpm = req.body.bpm || song.bpm;
        song.info = req.body.info || song.info;
        song.isDefault = req.body.isDefault || song.isDefault;
        if (req.files.audio) song.audioClip = `/uploads/${req.files.audio[0].filename}`;
        if (req.files.easyMidi) song.easyMidi = `/uploads/${req.files.easyMidi[0].filename}`;
        if (req.files.hardMidi) song.hardMidi = `/uploads/${req.files.hardMidi[0].filename}`;

        await song.save();
        console.log("Đã cập nhật bài hát:", song);

        res.json({ message: "Cập nhật bài hát thành công", song });
    } catch (error) {
        console.error("Lỗi khi cập nhật bài hát:", error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const deleteSong = async (req, res) => {
    try {
        const { id } = req.params;

        const song = await Song.findById(id);
        if (!song) {
            return res.status(404).json({ error: "Không tìm thấy bài hát" });
        }

        console.log(`Đang xóa bài hát: ${song.songName}`);

        await deleteFile(song.audioClip);
        await deleteFile(song.easyMidi);
        await deleteFile(song.hardMidi);

        await Song.findByIdAndDelete(id);
        console.log("Đã xóa bản ghi bài hát");

        const result = await ScoreInfo.deleteMany({ song_id: id });
        console.log(`Đã xóa ${result.deletedCount} bản ghi điểm`);

        res.json({ message: "Đã xóa thành công bài hát, tệp và dữ liệu điểm liên quan" });

    } catch (error) {
        console.error("Lỗi khi xóa bài hát:", error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const downloadFile = (req, res) => {
    const { filename } = req.params;
    const downloadStream = gridfsBucket.openDownloadStreamByName(filename);

    downloadStream.pipe(res);
    downloadStream.on("error", (err) => {
        console.error("Lỗi khi tải tệp xuống:", err);
        res.status(404).json({ error: "Không tìm thấy tệp" });
    });
    downloadStream.on("finish", () => {
        console.log(`Tệp ${filename} đã được phục vụ thành công.`);
    });
};

export { upload };
