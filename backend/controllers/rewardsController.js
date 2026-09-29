import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import PointsLedger from '../models/PointsLedger.js';
import User from '../models/User.js';
import { awardPoints, getTotalPoints, getLedger } from '../services/impactPointsEngine.js';
import { calculateTier } from '../services/tierCalculator.js';

// Helper: points earned from complaints (1 pt each) + ledger points
async function getEffectiveTotalPoints(citizenId) {
  const [complaintCount, ledgerPoints] = await Promise.all([
    Complaint.countDocuments({ userId: citizenId }),
    getTotalPoints(citizenId),
  ]);
  return complaintCount + ledgerPoints;
}

// Helper: build combined ledger from complaints + PointsLedger entries
async function getEffectiveLedger(citizenId, limit = 50) {
  const [complaints, ledgerEntries] = await Promise.all([
    Complaint.find({ userId: citizenId })
      .sort({ createdAt: -1 })
      .select('description category createdAt _id')
      .lean(),
    getLedger(citizenId, limit),
  ]);

  const complaintItems = complaints.map((c) => ({
    _id: `complaint-${c._id}`,
    points: 1,
    reason: 'COMPLAINT_SUBMITTED',
    description: c.description || c.category || 'Civic Issue',
    createdAt: c.createdAt,
  }));

  const ledgerItems = ledgerEntries.map((e) => ({
    ...e,
    description: null,
  }));

  // Merge and sort by date descending, cap at limit
  return [...complaintItems, ...ledgerItems]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

// GET /api/rewards/me
export const getMyRewards = async (req, res) => {
  try {
    const citizenId = req.user.id;
    const [totalPoints, ledger] = await Promise.all([
      getEffectiveTotalPoints(citizenId),
      getEffectiveLedger(citizenId, 50),
    ]);
    const tier = calculateTier(totalPoints);
    res.json({ totalPoints, tier, ledger });
  } catch (error) {
    console.error('getMyRewards:', error);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
};

// GET /api/rewards/leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    // Aggregate complaint counts per citizen
    const complaintCounts = await Complaint.aggregate([
      { $group: { _id: '$userId', complaintPoints: { $sum: 1 } } },
    ]);

    // Aggregate ledger points per citizen
    const ledgerPoints = await PointsLedger.aggregate([
      { $group: { _id: '$citizenId', ledgerPoints: { $sum: '$points' } } },
    ]);

    // Merge into a map
    const pointsMap = {};
    for (const c of complaintCounts) {
      pointsMap[c._id.toString()] = (pointsMap[c._id.toString()] || 0) + c.complaintPoints;
    }
    for (const l of ledgerPoints) {
      pointsMap[l._id.toString()] = (pointsMap[l._id.toString()] || 0) + l.ledgerPoints;
    }

    // Get all relevant user IDs
    const userIds = Object.keys(pointsMap).map((id) => new mongoose.Types.ObjectId(id));
    const users = await User.find({ _id: { $in: userIds } }).select('username').lean();
    const userMap = {};
    for (const u of users) userMap[u._id.toString()] = u.username;

    // Build sorted leaderboard
    const result = Object.entries(pointsMap)
      .map(([id, totalPoints]) => ({
        username: userMap[id] ?? 'Unknown',
        totalPoints,
        tier: calculateTier(totalPoints),
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 20);

    res.json(result);
  } catch (error) {
    console.error('getLeaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

// POST /api/rewards/upvote/:complaintId
export const upvoteComplaint = async (req, res) => {
  try {
    const citizenId = req.user.id;
    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Self-upvote check
    if (complaint.userId.toString() === citizenId.toString()) {
      return res.status(403).json({ error: 'Self-upvoting is not permitted' });
    }

    // Duplicate upvote check
    const alreadyUpvoted = complaint.upvotedBy.some(
      (id) => id.toString() === citizenId.toString()
    );
    if (alreadyUpvoted) {
      return res.status(409).json({ error: 'You have already upvoted this complaint' });
    }

    // Atomically add to upvotedBy
    await Complaint.findByIdAndUpdate(complaintId, {
      $addToSet: { upvotedBy: new mongoose.Types.ObjectId(citizenId) },
    });

    // Award points (non-fatal)
    try {
      await awardPoints(citizenId, 5, 'UPVOTE_CAST', complaintId);
    } catch (err) {
      console.error('awardPoints (upvote) failed:', err);
    }

    res.json({ message: 'Upvote recorded' });
  } catch (error) {
    console.error('upvoteComplaint:', error);
    res.status(500).json({ error: 'Failed to upvote complaint' });
  }
};

// POST /api/rewards/redeem
export const redeemReward = async (req, res) => {
  res.status(501).json({ message: 'Reward redemption is coming soon.' });
};
