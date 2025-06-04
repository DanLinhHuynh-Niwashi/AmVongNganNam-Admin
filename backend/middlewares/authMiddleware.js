import Account from "../models/accountModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyToken = async(req, res, next) =>{
  let token = null;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. If no token in cookie, try Authorization header
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader;
      token = token.replace("Bearer ", "");
    } else {
      token = authHeader;
    }
  }

  if (!token) {
    return res.status(401).json({
      message: "Từ chối truy cập, thiếu token."
    });
  }

  try {
    // Clean token in case 'Bearer ' prefix exists in cookie (defensive)
    if (token.startsWith("Bearer ")) {
      token = token.replace("Bearer ", "");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Account.findById(decoded.id);

    if (!user) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      });
      return res.status(404).json({
        message: "Không tìm thấy người dùng."
      });
    }

    req.user = decoded;
    next();
  } catch(error) {
    return res.status(401).json({
      message: "Token không hợp lệ."
    });
  }
};

export const isAdmin = (req, res, next) =>{
  if (!req.user) {
    return res.status(401).json({
      message: "Từ chối truy cập, không tìm thấy người dùng hợp lệ."
    });
  }
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      message: "Từ chối truy cập, quyền hạn không đủ."
    });
  }
  next();
};