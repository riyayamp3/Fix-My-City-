import { useState, useEffect } from "react";
import API from "@/services/api";
import { Complaint } from "@/types";
import { Job, ActiveJob } from "@/data/mockData";

export function useComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      const res = await API.get("/complaints");
      setComplaints(res.data);
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Map Complaint to Job for the UI
  const mappedJobs: Job[] = complaints.map((c, i) => ({
    id: c._id || `C${i}`,
    title: c.category ? `${c.category} Issue` : "Public Issue",
    description: c.description || "",
    category: (c.category as any) || "Roads",
    location: "View description for details",
    ward: "Assigned Ward",
    severity: "medium",
    deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    status: c.status === "COMPLETED" ? "completed" : c.status === "IN_PROGRESS" ? "in_progress" : "open",
    postedDate: c.createdAt || new Date().toISOString(),
  }));

  const openJobs = mappedJobs.filter(j => j.status === "open");
  
  const activeJobs: ActiveJob[] = mappedJobs.filter(j => j.status === "in_progress").map(j => ({
    ...j,
    currentStatus: "in_progress",
    notes: [],
    photos: complaints.find(comp => comp._id === j.id)?.imageUrl ? [complaints.find(comp => comp._id === j.id)?.imageUrl!] : [],
    awardedDate: j.postedDate
  }));

  const updateStatus = async (id: string, status: string) => {
    try {
      await API.patch(`/complaints/${id}/status`, { status });
      await fetchComplaints();
    } catch (err) {
      console.error("Failed to update status:", err);
      throw err;
    }
  };

  return { complaints, mappedJobs, openJobs, activeJobs, loading, updateStatus };
}
