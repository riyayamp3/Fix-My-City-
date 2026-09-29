import mongoose from 'mongoose';
import PointsLedger from '../models/PointsLedger.js';

/**
 * Awards points to a citizen by creating a ledger entry.
 * Idempotent — duplicate (citizenId, referenceId, reason) entries are silently ignored.
 *
 * @param {string} citizenId   - ObjectId of the citizen receiving points
 * @param {number} points      - Number of points to award
 * @param {string} reason      - Reason constant (e.g. 'COMPLAINT_VERIFIED')
 * @param {string} referenceId - ObjectId of the related complaint
 */
export async function awardPoints(citizenId, points, reason, referenceId) {
  try {
    await PointsLedger.create({ citizenId, points, reason, referenceId });
  } catch (err) {
    // Swallow duplicate-key errors silently (idempotency)
    if (err.code === 11000) return;
    throw err;
  }
}

/**
 * Returns the total points accumulated by a citizen.
 *
 * @param {string} citizenId - ObjectId of the citizen
 * @returns {Promise<number>}
 */
export async function getTotalPoints(citizenId) {
  const result = await PointsLedger.aggregate([
    { $match: { citizenId: new mongoose.Types.ObjectId(citizenId) } },
    { $group: { _id: null, total: { $sum: '$points' } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
}

/**
 * Returns ledger entries for a citizen, sorted by createdAt descending, capped at limit.
 *
 * @param {string} citizenId - ObjectId of the citizen
 * @param {number} limit     - Maximum number of entries to return
 * @returns {Promise<Array>}
 */
export async function getLedger(citizenId, limit) {
  return PointsLedger.find({ citizenId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
