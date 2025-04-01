import express from "express";
import { signup, login, logout, changePassword, changeAccountInfo, resetPassword, getUser } from "../controllers/authController.js";
import { body } from "express-validator";
import { validatePassword as _validatePassword } from "../utils/password-strength.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js"; // Middleware for JWT authentication

const authRoutes = express.Router();

// Validation rules for signup
export const validateSignup = [
  body("name").notEmpty().withMessage("Name is required."), // Fixed to match signup request
  body("email").isEmail().withMessage("Invalid email format."),
  body("password").custom((value) => {
    const { isValid, error } = _validatePassword(value);
    if (!isValid) {
      throw new Error(error);
    }
    return true;
  }),
];

authRoutes.post("/signup", validateSignup, signup);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.post("/reset-password", resetPassword);
authRoutes.post("/change-password", verifyToken, changePassword);
authRoutes.post("/change-info", verifyToken, changeAccountInfo);
authRoutes.get("/me", getUser);
authRoutes.post("/admin-only", verifyToken, isAdmin, (req, res) => {
  res.json({ message: "Admin access granted." });
});

export default authRoutes;
