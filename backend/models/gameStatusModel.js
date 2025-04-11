import mongoose from "mongoose";

const gameStatusSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    unique: true
  },
  unlocked_songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  unlocked_instruments: [String],
  highscore: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScoreInfo'
  }],
  song_token: Number,
  instrument_token: Number
});

export default mongoose.model("GameStatus", gameStatusSchema);
