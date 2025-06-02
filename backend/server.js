import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import songRoutes from "./routes/songRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import gameStatusRoutes from "./routes/gameStatusRoutes.js";
import playerRoutes from "./routes/playerRoutes.js";
dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cookieParser()); 
app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, true); // Allow any origin
      },
      credentials: true,
    })
  );
  
app.use("/api/songs", songRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/game-status", gameStatusRoutes);
app.use("/api/player", playerRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
