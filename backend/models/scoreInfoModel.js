import mongoose from "mongoose";

const scoreInfoSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  song_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true,
  },
  easyScore: { type: Number, default: 0 },
  easyState: { type: String, enum: ['NC', 'C', 'FC', 'AP'], default: 'NC'},
  hardScore: { type: Number, default: 0 },
  hardState: { type: String, enum: ['NC', 'C', 'FC', 'AP'], default: 'NC'},
});

export default mongoose.model("ScoreInfo", scoreInfoSchema);
 