import Account from "../models/accountModel.js";
import GameStatus from "../models/gameStatusModel.js";
import ScoreInfo from "../models/scoreInfoModel.js";
import Ban from "../models/banModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  validationResult
}
from "express-validator";
import {
  sendResetPasswordEmail as _sendResetPasswordEmail
}
from "../utils/email-password.js";
import dotenv from "dotenv";

dotenv.config();

export const signup = async(req, res) =>{
  const errors = validationResult(req);
  const validationErrors = [];

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Xác thực thất bại.",
      errors: errors.array().map((err) =>({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  const { email, name, password } = req.body;

  try {
    let existingUser = await Account.findOne({ email });
    if (existingUser) {
      validationErrors.push({
        field: "email",
        message: "Email đã được đăng ký."
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Đăng ký thất bại.",
        errors: validationErrors,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new Account({ name, email, password: hashedPassword });
    await newUser.save();

    try {
      if (!newUser.isAdmin) {
        const newGameRecord = new GameStatus({
          user_id: newUser._id,
          unlocked_songs: [],
          unlocked_instruments: [],
          highscore: []
        });
        await newGameRecord.save();
      }

      res.status(201).json({
        success: true,
        message: "Tạo tài khoản thành công.",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email
        },
      });
    } catch (gameStatusError) {
      await Account.findByIdAndDelete(newUser._id);
      return res.status(500).json({
        success: false,
        message: "Đăng ký thất bại khi khởi tạo dữ liệu trò chơi. Tài khoản đã bị xóa.",
        error: gameStatusError.message
      });
    }
  } catch(error) {
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ.",
      error: error.message
    });
  }
};

export const login = async(req, res) =>{
  const { email, password } = req.body;

  try {
    const user = await Account.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Email hoặc mật khẩu không đúng."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Email hoặc mật khẩu không đúng."
      });
    }

    const now = new Date();
    const activeBan = await Ban.findOne({
      userId: user._id,
      $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }]
    });

    if (activeBan) {
      return res.status(403).json({
        message: `Tài khoản của bạn đang bị khóa: ${activeBan.reason}${activeBan.expiresAt ? `. Hết hạn vào ${activeBan.expiresAt.toISOString()}` : " (khóa vĩnh viễn)"}.`,
        reason: activeBan.reason,
        expiresAt: activeBan.expiresAt || null
      });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    res.json({
      message: "Đăng nhập thành công.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      },
      token: token
    });
  } catch(error) {
    res.status(500).json({
      message: "Lỗi máy chủ.",
      error: error.message
    });
  }
};

export const logout = (req, res) =>{
  res.cookie("token", "", {
    expires: new Date(0),
    httpOnly: true
  });
  res.json({
    message: "Đăng xuất thành công."
  });
};

export async function resetPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await Account.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: `Không tìm thấy người dùng với email (${email}).`
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "5m"
    });
    const mail = await _sendResetPasswordEmail(email, token);
    if (mail) {
      return res.status(200).json({
        message: `Liên kết đặt lại mật khẩu đã được gửi tới email của bạn (${email}).`
      });
    }
  } catch(err) {
    console.error("Lỗi khi gửi email đặt lại mật khẩu:", err);
    return res.status(500).json({
      message: "Lỗi khi gửi email đặt lại mật khẩu."
    });
  }
};

export const changePassword = async(req, res) =>{
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: `Xác thực thất bại. ${errors.array()[0].msg}`,
    });
  }

  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await Account.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng."
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Mật khẩu hiện tại không chính xác."
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    res.json({
      message: "Mật khẩu đã được cập nhật thành công."
    });
  } catch(error) {
    res.status(500).json({
      message: "Lỗi máy chủ.",
      error: error.message
    });
  }
};

export const changeAccountInfo = async(req, res) =>{
  const { newName, newEmail } = req.body;
  const userId = req.user.id;

  try {
    const user = await Account.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng."
      });
    }

    if (newEmail) {
      let existingUser = await Account.findOne({ email: newEmail });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({
          message: "Email đã được sử dụng."
        });
      }
      user.email = newEmail;
    }

    if (newName) {
      user.name = newName;
    }

    await user.save();

    res.json({
      message: "Thông tin tài khoản đã được cập nhật thành công.",
      name: user.name,
      email: user.email,
    });
  } catch(error) {
    res.status(500).json({
      message: "Lỗi máy chủ.",
      error: error.message
    });
  }
};

export const deleteAccount = async(req, res) =>{
  const userId = req.user.id;

  try {
    const user = await Account.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng."
      });
    }

    await GameStatus.deleteOne({ user_id: userId });
    await ScoreInfo.deleteMany({ user_id: userId });

    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict"
    });

    res.status(200).json({
      message: "Tài khoản và dữ liệu liên quan đã được xóa thành công."
    });
  } catch(error) {
    console.error("Lỗi khi xóa tài khoản:", error);
    res.status(500).json({
      message: "Lỗi máy chủ.",
      error: error.message
    });
  }
};

export const getUser = async(req, res) =>{
  try {
    let token = req.cookies.token;

    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Chưa xác thực."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Account.findById(decoded.id);

    if (!user) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "Strict"
      });
      return res.status(404).json({
        message: "Không tìm thấy người dùng."
      });
    }

    res.json({ user: decoded });
  } catch(error) {
    console.log(error.message);
    res.status(403).json({
      message: "Token không hợp lệ."
    });
  }
};

export const getUserInfo = async(req, res) =>{
  try {
    let token = req.cookies.token;
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Chưa xác thực."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Account.findById(decoded.id);
    if (!user) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "Strict"
      });
      return res.status(404).json({
        message: "Không tìm thấy người dùng."
      });
    }

    res.json({ user });
  } catch(error) {
    console.log(error.message);
    res.status(403).json({
      message: "Token không hợp lệ."
    });
  }
};

export const getAllPlayerAccounts = async (req, res) => {
  try {
    const players = await Account.find({ isAdmin: false }).select("-password");

    res.status(200).json({
      success: true,
      players,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người chơi:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ.",
      error: error.message,
    });
  }
};
