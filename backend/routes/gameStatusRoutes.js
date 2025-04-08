import express from "express";
import { loadGameStatus, updateGameStatus, deleteGameStatus } from "../controllers/gameStatusController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const gameStatusRoutes = express.Router();

gameStatusRoutes.get("/", verifyToken, loadGameStatus);
gameStatusRoutes.put("/", verifyToken, updateGameStatus);
gameStatusRoutes.delete("/", verifyToken, deleteGameStatus);

export default gameStatusRoutes;
