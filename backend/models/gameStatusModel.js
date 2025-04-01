import mongoose from "mongoose";

const scoreInfoSchema = new mongoose.Schema({
  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true,
    unique: true  // Ensuring only one score entry per song
  },
  easyScore: { type: Number, default: 0 },
  hardScore: { type: Number, default: 0 }
});

const gameStatusSchema = new mongoose.Schema({
  user_id: { 
    type: String, 
    required: true,
    unique: true
  },
  unlocked_songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  unlocked_instruments: [String],
  highscore: [scoreInfoSchema]
});

export default mongoose.model("GameStatus", gameStatusSchema);
