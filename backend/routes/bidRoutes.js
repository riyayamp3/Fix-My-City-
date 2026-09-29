import express from "express";
import { getBidsByJob, createBid } from "../controllers/bidController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:jobId", protect, getBidsByJob);
router.post("/", protect, createBid);

export default router;
