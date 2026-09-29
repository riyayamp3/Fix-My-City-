import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getMyRewards,
  getLeaderboard,
  upvoteComplaint,
  redeemReward,
} from '../controllers/rewardsController.js';

const router = express.Router();

router.get('/me', protect, getMyRewards);
router.get('/leaderboard', protect, getLeaderboard);
router.post('/upvote/:complaintId', protect, upvoteComplaint);
router.post('/redeem', protect, redeemReward);

export default router;
