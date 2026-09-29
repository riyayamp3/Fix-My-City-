import Bid from "../models/Bid.js";
import Job from "../models/Job.js";

export const createBid = async (req, res) => {
  try {
    const { jobId, contractorId, eta, cost, note } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const bid = await Bid.create({ jobId, contractorId, eta, cost, note, status: "PENDING" });
    res.status(201).json(bid);
  } catch (error) {
    console.error("createBid error:", error);
    res.status(500).json({ error: "Failed to create bid" });
  }
};

export const getBidsByJob = async (req, res) => {
  try {
    const bids = await Bid.find({ jobId: req.params.jobId }).populate("contractorId", "username role");
    res.json(bids);
  } catch (error) {
    console.error("getBidsByJob error:", error);
    res.status(500).json({ error: "Failed to fetch bids" });
  }
};
