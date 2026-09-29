import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { transcribe } from "../controllers/voiceController.js";

const router = Router();

router.post("/transcribe", protect, transcribe);

export default router;
