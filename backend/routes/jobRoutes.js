import express from "express";
import {
  getJobs,
  createJob,
  getOpenJobs,
  assignJob,
  updateJobStatus,
} from "../controllers/jobController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getJobs);
router.post("/", protect, createJob);
router.get("/open", protect, getOpenJobs);
router.put("/:id/assign", protect, assignJob);
router.put("/:id/status", protect, updateJobStatus);

export default router;
