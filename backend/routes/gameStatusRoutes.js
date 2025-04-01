import express from "express";
import { loadGameStatus, updateGameStatus, deleteGameStatus } from "../controllers/gameStatusController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const gameStatusRoutes = express.Router();

gameStatusRoutes.get("/:id", verifyToken, loadGameStatus);
gameStatusRoutes.put("/:id", verifyToken, updateGameStatus);
gameStatusRoutes.delete("/:id", verifyToken, deleteGameStatus);

export default gameStatusRoutes;
