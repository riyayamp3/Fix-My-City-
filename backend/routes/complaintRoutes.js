import express from "express";
import { createComplaint, getComplaints, getComplaintById, getMyComplaints, updateComplaintStatus, updateVerificationStatus, getHotspots, getComplaintHistory } from "../controllers/complaintController.js";
import { protect } from "../middleware/authMiddleware.js";
import { analyzeImage, upload } from "../controllers/analyzeImageController.js";

const router = express.Router();

router.post("/", protect, createComplaint);
router.get("/", protect, getComplaints);
router.get("/my", protect, getMyComplaints);
router.get("/hotspots", protect, getHotspots);
router.get("/history", protect, getComplaintHistory);
router.post("/analyze-image", protect, upload.single("image"), analyzeImage);
router.get("/:id", protect, getComplaintById);
router.patch("/:id/status", protect, updateComplaintStatus);
router.patch("/:id/verification", protect, updateVerificationStatus);

export default router;
