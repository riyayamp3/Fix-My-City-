import express from "express";
import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import Job from "../models/Job.js";
import bcrypt from "bcryptjs";

const router = express.Router();

router.post("/demo", async (req, res) => {
  try {
    // Find or create a demo admin user
    let admin = await User.findOne({ username: "demo_admin" });
    if (!admin) {
      admin = await User.create({
        username: "demo_admin",
        password: await bcrypt.hash("demo1234", 10),
        role: "ADMIN",
      });
    }

    // Find or create a demo citizen user
    let citizen = await User.findOne({ username: "demo_citizen" });
    if (!citizen) {
      citizen = await User.create({
        username: "demo_citizen",
        password: await bcrypt.hash("demo1234", 10),
        role: "CITIZEN",
      });
    }

    const demoComplaints = [
      {
        userId: citizen._id,
        description: "Large pothole near MG Road junction causing traffic hazard. Approximately 2m x 1m, 30cm deep.",
        category: "Roads",
        severity: "HIGH",
        location: { lat: 12.9716, lng: 77.5946, address: "MG Road, Near Junction 4, Bengaluru" },
        status: "RECEIVED",
      },
      {
        userId: citizen._id,
        description: "4 non-functional LED streetlights on 4th Block main road. Poles intact, fixtures need replacement.",
        category: "Electrical",
        severity: "MEDIUM",
        location: { lat: 12.9254, lng: 77.5938, address: "4th Block Main Road, Jayanagar, Bengaluru" },
        status: "RECEIVED",
      },
      {
        userId: citizen._id,
        description: "Blocked storm drain causing waterlogging during rains. Needs debris removal and pipe inspection.",
        category: "Drainage",
        severity: "HIGH",
        location: { lat: 12.9784, lng: 77.6408, address: "100 Feet Road, Indiranagar, Bengaluru" },
        status: "RECEIVED",
      },
      {
        userId: citizen._id,
        description: "Major water pipeline leak at 8th Cross. Water wastage and road erosion. Urgent repair needed.",
        category: "Water",
        severity: "HIGH",
        location: { lat: 13.0035, lng: 77.5709, address: "8th Cross, Malleshwaram, Bengaluru" },
        status: "RECEIVED",
      },
      {
        userId: citizen._id,
        description: "Overflowing garbage bins near the market area. Foul smell and health hazard for residents.",
        category: "Sanitation",
        severity: "MEDIUM",
        location: { lat: 12.9634, lng: 77.5855, address: "KR Market, South Gate, Bengaluru" },
        status: "RECEIVED",
      },
    ];

    const createdComplaints = [];
    for (const c of demoComplaints) {
      const existing = await Complaint.findOne({ description: c.description });
      if (!existing) {
        const created = await Complaint.create(c);
        createdComplaints.push(created);
      } else {
        createdComplaints.push(existing);
      }
    }

    // Create demo jobs from the first 3 complaints
    const demoJobs = [
      {
        complaintId: createdComplaints[0]._id,
        title: "Pothole Repair – MG Road",
        description: "Large pothole near MG Road junction causing traffic hazard. Requires asphalt patching and compaction.",
        category: "Roads",
        severity: "HIGH",
        location: createdComplaints[0].location,
        status: "OPEN",
      },
      {
        complaintId: createdComplaints[1]._id,
        title: "Streetlight Replacement – Jayanagar",
        description: "4 non-functional LED streetlights on 4th Block main road. Poles intact, fixtures need replacement.",
        category: "Electrical",
        severity: "MEDIUM",
        location: createdComplaints[1].location,
        status: "OPEN",
      },
      {
        complaintId: createdComplaints[2]._id,
        title: "Storm Drain Clearing – Indiranagar",
        description: "Blocked storm drain causing waterlogging. Needs debris removal and pipe inspection.",
        category: "Drainage",
        severity: "HIGH",
        location: createdComplaints[2].location,
        status: "OPEN",
      },
    ];

    const createdJobs = [];
    for (const j of demoJobs) {
      const existing = await Job.findOne({ title: j.title });
      if (!existing) {
        const created = await Job.create(j);
        // Update complaint status
        await Complaint.findByIdAndUpdate(j.complaintId, { status: "JOB_CREATED" });
        createdJobs.push(created);
      } else {
        createdJobs.push(existing);
      }
    }

    res.json({
      message: "Demo data seeded successfully!",
      credentials: {
        admin: { username: "demo_admin", password: "demo1234", role: "ADMIN" },
        citizen: { username: "demo_citizen", password: "demo1234", role: "CITIZEN" },
      },
      complaints: createdComplaints.length,
      jobs: createdJobs.length,
    });
  } catch (err) {
    console.error("Seed error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
