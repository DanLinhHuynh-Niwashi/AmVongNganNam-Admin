import Ban from "../models/banModel.js";
import Account from "../models/accountModel.js";
import mongoose from "mongoose";

export const getBanByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Getting ban info for... ${userId}`);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const ban = await Ban.findOne({
      userId,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    })
    .sort({ createdAt: -1 }) 
    .lean();

    if (!ban) {
      return res.status(404).json({ message: "No active bans found for this user." });
    }

    res.json(ban);
  } catch (error) {
    console.error("Error fetching ban by user ID:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};


export const createBan = async (req, res) => {
  const { userId, reason, expiresAt } = req.body;
  const bannedBy = req.user?.id || req.body.bannedBy;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  try {
    const user = await Account.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // prevent duplicate active ban
    const existingBan = await Ban.findOne({
      userId,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    });

    if (existingBan) {
      return res.status(400).json({ message: "User is already banned." });
    }

    const ban = await Ban.create({
      userId,
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      bannedBy
    });

    res.status(201).json({ message: "Ban created successfully.", ban });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

export const updateBan = async (req, res) => {
  const { banId, reason, expiresAt } = req.body;
  if (!mongoose.Types.ObjectId.isValid(banId)) {
    return res.status(400).json({ message: "Invalid ban ID." });
  }

  try {
    const ban = await Ban.findByIdAndUpdate(
      banId,
      {
        ...(reason && { reason }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null })
      },
      { new: true }
    );

    if (!ban) {
      return res.status(404).json({ message: "Ban not found." });
    }

    res.json({ message: "Ban updated successfully.", ban });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

export const deleteBan = async (req, res) => {
  const { banId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(banId)) {
    return res.status(400).json({ message: "Invalid ban ID." });
  }

  try {
    const result = await Ban.findByIdAndDelete(banId);

    if (!result) {
      return res.status(404).json({ message: "Ban not found." });
    }

    res.json({ message: "Ban deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};
