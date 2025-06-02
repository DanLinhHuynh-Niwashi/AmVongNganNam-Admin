import mongoose from "mongoose";

const banSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
    index: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: null, // Null = permanent ban
  },
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
});

banSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

banSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    }
  }
);

const Ban = mongoose.model("Ban", banSchema, "BanInfo");

export default Ban;
