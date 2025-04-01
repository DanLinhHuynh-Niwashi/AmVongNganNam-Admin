import GameStatus from "../models/gameStatusModel.js";
import dotenv from "dotenv";

dotenv.config();

// Load Game Status
export const loadGameStatus = async (req, res) => {
    try {
      console.log("Finding game status for user..." + JSON.stringify(req.user))
      const gameStatus = await GameStatus.findOne({user_id: req.user.id}).populate("highscore.song");
      if (!gameStatus) {
        return res.status(404).json({ message: "Game status not found." });
      }
      res.json(gameStatus);
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  };
  
  // Update Game Status
  export const updateGameStatus = async (req, res) => {
    try {
      const updatedStatus = await GameStatus.findOneAndUpdate({user_id: req.user.id}, req.body, { new: true });
      if (!updatedStatus) {
        return res.status(404).json({ message: "Game status not found." });
      }
      res.json(updatedStatus);
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  };
  
  // Delete Game Status
  export const deleteGameStatus = async (req, res) => {
    try {
      const deletedStatus = await GameStatus.findOneAndDelete({user_id: req.user.id});
      if (!deletedStatus) {
        return res.status(404).json({ message: "Game status not found." });
      }
      res.json({ message: "Game status deleted successfully." });
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  };