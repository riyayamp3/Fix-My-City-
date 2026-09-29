import Complaint from "../models/Complaint.js";
import { awardPoints } from "../services/impactPointsEngine.js";

const VALID_STATUSES = ["RECEIVED", "JOB_CREATED", "IN_PROGRESS", "COMPLETED"];

export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate("userId", "username role");
    res.json(complaints);
  } catch (error) {
    console.error("getMyComplaints:", error);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
};

export const createComplaint = async (req, res) => {
  try {
    const {
      description, imageUrl, category, severity, location,
      capturedAt, captureLocation, deviceVerified,
    } = req.body;

    if (!description) return res.status(400).json({ error: "description is required" });
    if (!imageUrl)    return res.status(400).json({ error: "image is required" });
    if (!location?.lat || !location?.lng) return res.status(400).json({ error: "location is required" });

    // ── Timestamp verification ──────────────────────────────────────────────
    const submittedAt = new Date();
    let verificationStatus = "UNVERIFIED";
    let timeDeltaSeconds = null;

    if (capturedAt) {
      const capturedDate = new Date(capturedAt);
      if (isNaN(capturedDate.getTime())) {
        return res.status(422).json({ error: "Invalid capturedAt timestamp" });
      }
      timeDeltaSeconds = Math.abs((submittedAt - capturedDate) / 1000);

      if (timeDeltaSeconds <= 120) {
        verificationStatus = "VERIFIED";
      } else {
        // Timestamp too old — flag but still save (don't hard-reject, admins can review)
        verificationStatus = "FLAGGED";
        console.warn(
          `Complaint flagged: capturedAt=${capturedAt}, delta=${timeDeltaSeconds.toFixed(1)}s, user=${req.user.id}`
        );
      }
    }

    const normalizedSeverity = severity?.toUpperCase();
    const complaint = await Complaint.create({
      userId: req.user.id,
      description,
      imageUrl,
      category,
      severity: normalizedSeverity,
      location,
      status: "RECEIVED",
      capturedAt: capturedAt ? new Date(capturedAt) : null,
      deviceVerified: Boolean(deviceVerified),
      verificationStatus,
      verificationMeta: {
        timeDeltaSeconds,
        captureLocation: captureLocation ?? null,
        submittedAt,
      },
    });

    res.status(201).json({
      ...complaint.toObject(),
      verificationStatus,
    });
  } catch (error) {
    console.error("createComplaint:", error);
    res.status(500).json({ error: "Failed to create complaint" });
  }
};

export const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .populate("userId", "username role");
    res.json(complaints);
  } catch (error) {
    console.error("getComplaints:", error);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
};

export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate(
      "userId",
      "username role"
    );
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    res.json(complaint);
  } catch (error) {
    console.error("getComplaintById:", error);
    res.status(500).json({ error: "Failed to fetch complaint" });
  }
};

export const getHotspots = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      status: { $ne: "COMPLETED" },
      "location.lat": { $exists: true },
      "location.lng": { $exists: true },
    })
      .select("location category severity status description createdAt imageUrl")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(complaints);
  } catch (error) {
    console.error("getHotspots:", error);
    res.status(500).json({ error: "Failed to fetch hotspots" });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Award points non-fatally when complaint is completed
    if (status === "COMPLETED") {
      try {
        await awardPoints(complaint.userId, 20, "COMPLAINT_COMPLETED", complaint._id);
      } catch (err) {
        console.error("awardPoints (COMPLAINT_COMPLETED) failed:", err);
      }
    }

    res.json(complaint);
  } catch (error) {
    console.error("updateComplaintStatus:", error);
    res.status(500).json({ error: "Failed to update complaint status" });
  }
};

const VALID_VERIFICATION_STATUSES = ["VERIFIED", "FLAGGED", "UNVERIFIED"];

export const updateVerificationStatus = async (req, res) => {
  try {
    const { verificationStatus } = req.body;
    if (!VALID_VERIFICATION_STATUSES.includes(verificationStatus)) {
      return res.status(400).json({
        error: `verificationStatus must be one of: ${VALID_VERIFICATION_STATUSES.join(", ")}`,
      });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { verificationStatus },
      { new: true }
    );
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Award points non-fatally when complaint is verified
    if (verificationStatus === "VERIFIED") {
      try {
        await awardPoints(complaint.userId, 10, "COMPLAINT_VERIFIED", complaint._id);
      } catch (err) {
        console.error("awardPoints (COMPLAINT_VERIFIED) failed:", err);
      }
    }

    res.json(complaint);
  } catch (error) {
    console.error("updateVerificationStatus:", error);
    res.status(500).json({ error: "Failed to update verification status" });
  }
};

export const getComplaintHistory = async (req, res) => {
  try {
    let { category, severity, status, startDate, endDate, offset, limit } = req.query;

    // Coerce pagination params
    offset = Math.max(0, parseInt(offset) || 0);
    limit  = Math.min(500, Math.max(1, parseInt(limit) || 50));

    // Build filter — always require valid coordinates
    const filter = {
      'location.lat': { $exists: true, $ne: null },
      'location.lng': { $exists: true, $ne: null },
    };

    if (category && category !== 'ALL') filter.category = category;
    if (severity && severity !== 'ALL') filter.severity = severity;
    if (status   && status   !== 'ALL') filter.status   = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const d = new Date(startDate);
        if (isNaN(d.getTime())) {
          return res.status(422).json({ error: 'Invalid startDate: must be ISO 8601' });
        }
        filter.createdAt.$gte = d;
      }
      if (endDate) {
        const d = new Date(endDate);
        if (isNaN(d.getTime())) {
          return res.status(422).json({ error: 'Invalid endDate: must be ISO 8601' });
        }
        filter.createdAt.$lte = d;
      }
    }

    const complaints = await Complaint.find(filter)
      .select('_id location category severity status description createdAt imageUrl')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    res.json(complaints);
  } catch (error) {
    console.error('getComplaintHistory:', error);
    res.status(500).json({ error: 'Failed to fetch complaint history' });
  }
};
