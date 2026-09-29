import Job from "../models/Job.js";
import Complaint from "../models/Complaint.js";
import Bid from "../models/Bid.js";
import User from "../models/User.js";

export const createJob = async (req, res) => {
  try {
    const { complaintId, title, description, category, severity, location } = req.body;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    const job = await Job.create({
      complaintId,
      title,
      description,
      category,
      severity,
      location,
      status: "OPEN",
    });

    await Complaint.findByIdAndUpdate(complaintId, { status: "JOB_CREATED" });

    res.status(201).json(job);
  } catch (error) {
    console.error("createJob error:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
};

export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .sort({ createdAt: -1 })
      .populate("complaintId")
      .populate("assignedTo", "username role");

    res.status(200).json(jobs);
  } catch (error) {
    console.error("getJobs error:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
};

export const getOpenJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "OPEN" }).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    console.error("getOpenJobs error:", error);
    res.status(500).json({ error: "Failed to fetch open jobs" });
  }
};

export const assignJob = async (req, res) => {
  try {
    const { contractorId, bidId } = req.body;
    const { id } = req.params;

    const contractor = await User.findById(contractorId);
    if (!contractor) return res.status(404).json({ error: "Contractor not found" });

    const job = await Job.findByIdAndUpdate(
      id,
      { assignedTo: contractorId, status: "ASSIGNED" },
      { new: true }
    );

    await Bid.findByIdAndUpdate(bidId, { status: "ACCEPTED" });
    await Bid.updateMany(
      { jobId: req.params.id, _id: { $ne: bidId } },
      { status: "REJECTED" }
    );

    res.status(200).json(job);
  } catch (error) {
    console.error("assignJob error:", error);
    res.status(500).json({ error: "Failed to assign job" });
  }
};

export const updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    job.status = status;
    await job.save();

    if (status === "COMPLETED") {
      await Complaint.findByIdAndUpdate(job.complaintId, { status: "COMPLETED" });
    }

    res.status(200).json(job);
  } catch (error) {
    console.error("updateJobStatus error:", error);
    res.status(500).json({ error: "Failed to update job status" });
  }
};
