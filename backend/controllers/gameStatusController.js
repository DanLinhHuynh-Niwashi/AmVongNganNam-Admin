import GameStatus from "../models/gameStatusModel.js";
import ScoreInfo from '../models/scoreInfoModel.js';
import mongoose from "mongoose";

export const loadGameStatus = async (req, res) => {
  try {
    console.log("Đang tìm trạng thái trò chơi cho người dùng: " + JSON.stringify(req.user));

    const gameStatus = await GameStatus.findOne({ user_id: req.user.id })
      .populate({ path: 'highscore' })
      .exec();

    if (!gameStatus) {
      console.log("Không tìm thấy trạng thái trò chơi cho người dùng: " + req.user.id);
      return res.status(404).json({ message: "Không tìm thấy trạng thái trò chơi." });
    }

    console.log("Đã tìm thấy trạng thái trò chơi:", JSON.stringify(gameStatus));
    res.json(gameStatus);
  } catch (error) {
    console.error("Lỗi khi tải trạng thái trò chơi:", error);
    res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
  }
};

export const updateGameStatus = async (req, res) => {
  try {
    const { highscore, unlocked_songs, unlocked_instruments, song_token, instrument_token } = req.body;

    const updateFields = {};
    let updatedScoreIds = [];

    console.log("Đang cập nhật trạng thái trò chơi cho người dùng:", req.user.id);

    if (highscore) {
      console.log("Đang xử lý cập nhật điểm cao:", highscore);
      updatedScoreIds = await Promise.all(highscore.map(async (score) => {
        let scoreInfo = await ScoreInfo.findOne({
          user_id: req.user.id,
          song_id: score.song_id
        });

        if (scoreInfo) {
          console.log(`Cập nhật điểm đã có cho bài hát ${score.song_id}...`);
          if (score.easyScore !== undefined) scoreInfo.easyScore = score.easyScore;
          if (score.easyState !== undefined) scoreInfo.easyState = score.easyState;
          if (score.hardScore !== undefined) scoreInfo.hardScore = score.hardScore;
          if (score.hardState !== undefined) scoreInfo.hardState = score.hardState;

          await scoreInfo.save();
        } else {
          console.log(`Tạo điểm mới cho bài hát ${score.song_id}...`);
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
      console.log("Danh sách ID điểm đã cập nhật:", updatedScoreIds);
    }

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
      console.log("Không tìm thấy trạng thái trò chơi, tạo mới cho người dùng:", req.user.id);
    }

    if (updatedScoreIds.length > 0) {
      const existingScoreIds = existingStatus.highscore.map(id => id.toString());
      const mergedScores = [...new Set([...existingScoreIds, ...updatedScoreIds.map(id => id.toString())])];
      updateFields.highscore = mergedScores;
      console.log("Danh sách điểm cao sau khi gộp:", mergedScores);
    }

    if (unlocked_songs.length > 0) updateFields.unlocked_songs = unlocked_songs;
    if (unlocked_instruments.length > 0) updateFields.unlocked_instruments = unlocked_instruments;
    if (song_token >= 0) updateFields.song_token = song_token;
    if (instrument_token >= 0) updateFields.instrument_token = instrument_token;

    console.log("Trường sẽ được cập nhật:", updateFields);

    const updatedStatus = await GameStatus.findOneAndUpdate(
      { user_id: req.user.id },
      { $set: updateFields },
      { new: true }
    );

    console.log("Đã cập nhật trạng thái trò chơi:", JSON.stringify(updatedStatus));
    res.json(updatedStatus);
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái trò chơi:", error);
    res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
  }
};

export const deleteGameStatus = async (req, res) => {
  try {
    console.log("Đang xóa trạng thái trò chơi cho người dùng:", req.user.id);

    const gameStatus = await GameStatus.findOne({ user_id: req.user.id });

    if (!gameStatus) {
      console.log("Không tìm thấy trạng thái trò chơi của người dùng:", req.user.id);
      return res.status(404).json({ message: "Không tìm thấy trạng thái trò chơi." });
    }

    await ScoreInfo.deleteMany({
      _id: { $in: gameStatus.highscore }
    });

    await GameStatus.findOneAndDelete({ user_id: req.user.id });

    console.log("Đã xóa trạng thái trò chơi và điểm liên quan cho người dùng:", req.user.id);
    res.json({ message: "Đã xóa trạng thái trò chơi và điểm liên quan thành công." });
  } catch (error) {
    console.error("Lỗi khi xóa trạng thái trò chơi:", error);
    res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
  }
};

export const loadGameStatusById = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ." });
    }

    const gameStatus = await GameStatus.findOne({ user_id: userId })
      .populate({ path: "user_id", select: "name email" })
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
      return res.status(404).json({ message: "Không tìm thấy trạng thái trò chơi cho người dùng này." });
    }

    res.json(gameStatus);
  } catch (error) {
    console.error("Lỗi khi tải trạng thái trò chơi theo ID người dùng:", error);
    res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
  }
};
