import express from "express";
import { loadGameStatusById } from "../controllers/gameStatusController.js";
import { getAllPlayerAccounts } from "../controllers/authController.js";
import { createBan, getBanByUserId, updateBan, deleteBan } from "../controllers/banController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const playerRoutes = express.Router();

playerRoutes.get("/status/:userId", verifyToken, isAdmin, loadGameStatusById);
playerRoutes.get("/players", verifyToken, isAdmin, getAllPlayerAccounts);
playerRoutes.get("/ban/:userId", verifyToken, isAdmin, getBanByUserId);
playerRoutes.post("/ban", verifyToken, isAdmin, createBan);
playerRoutes.put("/ban", verifyToken, isAdmin, updateBan);
playerRoutes.delete("/ban/:banId", verifyToken, isAdmin, deleteBan);

export default playerRoutes;