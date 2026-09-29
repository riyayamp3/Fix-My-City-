import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import bidRoutes from "./routes/bidRoutes.js";
import seedRoutes from "./routes/seedRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import rewardsRoutes from "./routes/rewardsRoutes.js";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.warn("Warning: GEMINI_API_KEY is not set. AI features will not work.");
}

if (!process.env.SARVAM_API_KEY) {
  console.warn("Warning: SARVAM_API_KEY is not set. Voice features will not work.");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/rewards", rewardsRoutes);

const distPath = path.join(
  __dirname,
  "../fixmycity-authority-portal-main/FixMyCity-authority-portal-main/dist"
);

app.use(express.static(distPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
