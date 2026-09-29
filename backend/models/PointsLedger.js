import mongoose from "mongoose";

const pointsLedgerSchema = new mongoose.Schema({
  citizenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  points: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Unique compound index to enforce idempotency
pointsLedgerSchema.index({ citizenId: 1, referenceId: 1, reason: 1 }, { unique: true });

export default mongoose.model("PointsLedger", pointsLedgerSchema);
