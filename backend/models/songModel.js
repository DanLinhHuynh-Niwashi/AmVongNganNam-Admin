import mongoose from "mongoose";

const songSchema = new mongoose.Schema({
    songName: { type: String, required: true },
    composer: { type: String, required: true },
    genre: { type: String, required: true },
    bpm: { type: Number, required: true },
    info: { type: String },
    audioClip: { type: String }, // URL from GridFS
    easyMidi: { type: String }, // URL from GridFS
    hardMidi: { type: String }, // URL from GridFS
    hardNoteTimings: { type: [Number], default: [] },
    easyNoteTimings: { type: [Number], default: [] },
});

const Song = mongoose.model("Song", songSchema, "SongInfo");
export default Song;
