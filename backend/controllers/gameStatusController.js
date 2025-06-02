import GameStatus from "../models/gameStatusModel.js";
import ScoreInfo from '../models/scoreInfoModel.js';
import mongoose from "mongoose";

export const loadGameStatus = async (req, res) => {
  try {
    console.log("Finding game status for user: " + JSON.stringify(req.user));

    const gameStatus = await GameStatus.findOne({ user_id: req.user.id })
      .populate({
        path: 'highscore'
      })
      .exec();

    if (!gameStatus) {
      console.log("Game status not found for user: " + req.user.id);
      return res.status(404).json({ message: "Game status not found." });
    }

    console.log("Game status found:", JSON.stringify(gameStatus));
    res.json(gameStatus);
  } catch (error) {
    console.error("Error loading game status:", error);  // Debugging error
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

export const updateGameStatus = async (req, res) => {
  try {
    const { highscore, unlocked_songs, unlocked_instruments, song_token, instrument_token } = req.body;

    const updateFields = {};
    let updatedScoreIds = [];

    console.log("Updating game status for user:", req.user.id);  // Debugging start of update process

    if (highscore) {
      console.log("Processing highscore updates:", highscore);  // Debugging highscore data
      updatedScoreIds = await Promise.all(highscore.map(async (score) => {
        let scoreInfo = await ScoreInfo.findOne({
          user_id: req.user.id,
          song_id: score.song_id
        });

        if (scoreInfo) {
          console.log(`Updating existing score for song ${score.song_id}...`);  // Debugging if score exists
          if (score.easyScore !== undefined) scoreInfo.easyScore = score.easyScore;
          if (score.easyState !== undefined) scoreInfo.easyState = score.easyState;
          if (score.hardScore !== undefined) scoreInfo.hardScore = score.hardScore;
          if (score.hardState !== undefined) scoreInfo.hardState = score.hardState;

          await scoreInfo.save();
        } else {
          console.log(`Creating new score for song ${score.song_id}...`);  // Debugging if score is new
          scoreInfo = new ScoreInfo({
            user_id: req.user.id,
            song_id: score.song_id,
            easyScore: score.easyScore || 0,
            easyState: score.easyState || "",
            hardScore: score.hardScore || 0,
            hardState: score.hardState || ""
          });
          await scoreInfo.save();
        }

        return scoreInfo ? scoreInfo._id : null;
      }));

      updatedScoreIds = updatedScoreIds.filter(scoreId => scoreId !== null);
      console.log("Updated score IDs:", updatedScoreIds);  // Debugging the updated score IDs
    }

    // Get current game status
    let existingStatus = await GameStatus.findOne({ user_id: req.user.id });

    if (!existingStatus) {
      const newGameRecord = new GameStatus({
        user_id: req.user.id,
        unlocked_songs: [],
        unlocked_instruments: [],
        highscore: []
      });
      await newGameRecord.save();
      existingStatus = newGameRecord;
      console.log("Game status not found for user, creating:", req.user.id);  // Debugging if no existing game status found
    }

    // Prepare merged highscore (no duplicates)
    if (updatedScoreIds.length > 0) {
      const existingScoreIds = existingStatus.highscore.map(id => id.toString());
      const mergedScores = [...new Set([...existingScoreIds, ...updatedScoreIds.map(id => id.toString())])];
      updateFields.highscore = mergedScores;
      console.log("Merged highscore IDs:", mergedScores);  // Debugging merged highscore IDs
    }

    if (unlocked_songs.length > 0) updateFields.unlocked_songs = unlocked_songs;
    if (unlocked_instruments.length > 0) updateFields.unlocked_instruments = unlocked_instruments;
    if (song_token >= 0) updateFields.song_token = song_token;
    if (instrument_token >= 0) updateFields.instrument_token = instrument_token;

    console.log("Update fields:", updateFields);  // Debugging the fields to be updated

    const updatedStatus = await GameStatus.findOneAndUpdate(
      { user_id: req.user.id },
      { $set: updateFields },
      { new: true }
    );

    console.log("Updated game status:", JSON.stringify(updatedStatus));  // Debugging the updated game status
    res.json(updatedStatus);
  } catch (error) {
    console.error("Error updating game status:", error);  // Debugging error
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

export const deleteGameStatus = async (req, res) => {
  try {
    console.log("Deleting game status for user:", req.user.id);  // Debugging the delete process

    const gameStatus = await GameStatus.findOne({ user_id: req.user.id });
    
    if (!gameStatus) {
      console.log("Game status not found for user:", req.user.id);  // Debugging if status isn't found
      return res.status(404).json({ message: "Game status not found." });
    }

    await ScoreInfo.deleteMany({
      _id: { $in: gameStatus.highscore }  // Debugging deletion of associated scores
    });

    await GameStatus.findOneAndDelete({ user_id: req.user.id });

    console.log("Game status and associated scores deleted successfully for user:", req.user.id);  // Debugging successful deletion
    res.json({ message: "Game status and associated scores deleted successfully." });
  } catch (error) {
    console.error("Error deleting game status:", error);  // Debugging error
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

export const loadGameStatusById = async (req, res) => {
  try {
    const { userId } = req.params; // id = user ID
    console.log(userId)
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const gameStatus = await GameStatus.findOne({ user_id: userId })
      .populate({
        path: "user_id",
        select: "name email",
      })
      .populate({
        path: "highscore",
        populate: {
          path: "song_id",
          select: "songName genre",
        },
      })
      .lean()
      .exec();

    if (!gameStatus) {
      return res.status(404).json({ message: "GameStatus not found for this user." });
    }

    res.json(gameStatus);
  } catch (error) {
    console.error("Error loading game status by user ID:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};