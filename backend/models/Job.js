import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Complaint",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  category: String,
  severity: String,
  location: {
    lat: Number,
    lng: Number,
    address: String,
  },
  status: {
    type: String,
    enum: ["OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED"],
    default: "OPEN",
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

export default mongoose.model("Job", jobSchema);
