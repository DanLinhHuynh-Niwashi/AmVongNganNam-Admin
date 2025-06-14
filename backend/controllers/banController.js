import Ban from "../models/banModel.js";
import Account from "../models/accountModel.js";
import mongoose from "mongoose";

export const getBanByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Lấy thông tin khóa tài khoản cho... ${userId}`);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ." });
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
      return res.status(404).json({ message: "Không tìm thấy lệnh khóa tài khoản đang hoạt động cho người dùng này." });
    }

    res.json(ban);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin khóa tài khoản:", error);
    res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
  }
};

export const createBan = async (req, res) => {
  const { userId, reason, expiresAt } = req.body;
  const bannedBy = req.user?.id || req.body.bannedBy;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "ID người dùng không hợp lệ." });
  }

  try {
    const user = await Account.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    const existingBan = await Ban.findOne({
      userId,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    });

    if (existingBan) {
      return res.status(400).json({ message: "Người dùng đã bị khóa tài khoản." });
    }

    const ban = await Ban.create({
      userId,
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      bannedBy
    });

    res.status(201).json({ message: "Khóa tài khoản thành công.", ban });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
  }
};

export const updateBan = async (req, res) => {
  const { banId, reason, expiresAt } = req.body;

  if (!mongoose.Types.ObjectId.isValid(banId)) {
    return res.status(400).json({ message: "ID khóa tài khoản không hợp lệ." });
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
      return res.status(404).json({ message: "Không tìm thấy lệnh khóa tài khoản." });
    }

    res.json({ message: "Cập nhật lệnh khóa thành công.", ban });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
  }
};

export const deleteBan = async (req, res) => {
  const { banId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(banId)) {
    return res.status(400).json({ message: "ID khóa tài khoản không hợp lệ." });
  }

  try {
    const result = await Ban.findByIdAndDelete(banId);

    if (!result) {
      return res.status(404).json({ message: "Không tìm thấy lệnh khóa tài khoản." });
    }

    res.json({ message: "Xóa lệnh khóa tài khoản thành công." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
  }
};
