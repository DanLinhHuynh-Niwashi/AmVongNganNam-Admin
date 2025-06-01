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
  // Check for validation errors
  const errors = validationResult(req);
  const validationErrors = [];

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((err) =>({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  const {
    email,
    name,
    password
  } = req.body;

  try {
    let existingUser = await Account.findOne({
      email
    });
    if (existingUser) {
      validationErrors.push({
        field: "email",
        message: "Email already registered."
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Signup failed.",
        errors: validationErrors,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new Account({
      name,
      email,
      password: hashedPassword
    });
    await newUser.save();
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
      message: "Account created successfully.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      },
    });
  } catch(error) {
    res.status(500).json({
      success: false,
      message: "Server error.",
      error: error.message
    });
  }
};

export const login = async(req, res) =>{
  const {
    email,
    password
  } = req.body;

  try {
    const user = await Account.findOne({
      email
    });
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password."
      });
    }
    const now = new Date();
    const activeBan = await Ban.findOne({
      userId: user._id,
      $or: [{
        expiresAt: {
          $gt: now
        }
      },
      // temporary ban still active
      {
        expiresAt: null
      } // permanent ban
      ]
    });

    if (activeBan) {
      return res.status(403).json({
        message: `Your account is currently banned: 
        ${activeBan.reason}
        ${activeBan.expiresAt ? `. Ban expires at 
        ${activeBan.expiresAt.toISOString()}` : " (permanent ban)"}.`,
        reason: activeBan.reason,
        expiresAt: activeBan.expiresAt || null
      });
    }

    const token = jwt.sign({
      id: user._id,
      name: user.name,
      isAdmin: user.isAdmin
    },
    process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    // Set token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // Secure in production
      sameSite: "Strict",
    });

    res.json({
      message: "Login successful.",
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
      message: "Server error.",
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
    message: "Logout successful."
  });
};

export async function resetPassword(req, res) {
  try {
    const {
      email
    } = req.body;
    const user = await Account.findOne({
      email
    });
    if (!user) {
      return res.status(404).json({
        message: `User with this email($ {
          email
        }) does not exist.`
      });
    }
    // Create a reset token (valid for 5 minutes)
    const token = jwt.sign({
      id: user._id
    },
    process.env.JWT_SECRET, {
      expiresIn: "5m"
    });
    const mail = await _sendResetPasswordEmail(email, token);
    if (mail) {
      return res.status(200).json({
        message: `Password reset link sent to your email $ {
          email
        }.`
      });
    }
  } catch(err) {
    console.error("Error sending reset email:", err);
    return res.status(500).json({
      message: "Error sending reset email."
    });
  }
};

export const changePassword = async(req, res) =>{
  const {
    currentPassword,
    newPassword
  } = req.body;
  const userId = req.user.id;

  try {
    const user = await Account.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect current password."
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    res.json({
      message: "Password updated successfully."
    });
  } catch(error) {
    res.status(500).json({
      message: "Server error.",
      error: error.message
    });
  }
};

export const changeAccountInfo = async(req, res) =>{
  const {
    newName,
    newEmail
  } = req.body;
  const userId = req.user.id;

  try {
    const user = await Account.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    if (newEmail) {
      let existingUser = await Account.findOne({
        email: newEmail
      });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({
          message: "Email already in use."
        });
      }
      user.email = newEmail;
    }

    if (newName) {
      user.name = newName;
    }

    await user.save();

    res.json({
      message: "Account details updated successfully.",
      name: user.name,
      email: user.email,
    });
  } catch(error) {
    res.status(500).json({
      message: "Server error.",
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
        message: "User not found."
      });
    }

    await GameStatus.deleteOne({
      user_id: userId
    });

    await ScoreInfo.deleteMany({
      user_id: userId
    });

    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict"
    });

    res.status(200).json({
      message: "Account and related data deleted successfully."
    });
  } catch(error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      message: "Server error.",
      error: error.message
    });
  }
};

export const getUser = async(req, res) =>{
  try {
    let token = req.cookies.token;

    if (!token && req.headers.authorization) {
      // Check Authorization header as fallback
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated"
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
        message: "User not found"
      });
    }

    res.json({
      user: decoded
    });
  } catch(error) {
    console.log(error.message);
    res.status(403).json({
      message: "Invalid token"
    });
  }
};

export const getUserInfo = async(req, res) =>{
  try {
    const token = req.cookies.token;
    if (!token && req.headers.authorization) {
      // Check Authorization header as fallback
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated"
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
        message: "User not found"
      });
    }

    res.json({
      user: user
    });
  } catch(error) {
    console.log(error.message);
    res.status(403).json({
      message: "Invalid token"
    });
  }
};