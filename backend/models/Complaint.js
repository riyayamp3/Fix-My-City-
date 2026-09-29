import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: String,
  imageUrl: String,
  category: String,
  severity: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH"],
  },
  location: {
    lat: Number,
    lng: Number,
    address: String,
  },
  status: {
    type: String,
    enum: ["RECEIVED", "JOB_CREATED", "IN_PROGRESS", "COMPLETED"],
    default: "RECEIVED",
  },
  capturedAt: { type: Date },
  deviceVerified: { type: Boolean, default: false },
  verificationStatus: {
    type: String,
    enum: ["VERIFIED", "FLAGGED", "UNVERIFIED"],
    default: "UNVERIFIED",
  },
  verificationMeta: {
    timeDeltaSeconds: Number,      // |submittedAt - capturedAt| in seconds
    captureLocation: {
      lat: Number,
      lng: Number,
    },
    submittedAt: Date,
  },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
}, { timestamps: true });

export default mongoose.model("Complaint", complaintSchema);
