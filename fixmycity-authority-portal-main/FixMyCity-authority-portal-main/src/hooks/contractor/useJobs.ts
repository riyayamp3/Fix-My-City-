import { useState, useEffect, useCallback } from "react";
import API from "@/services/api";

export interface ApiJob {
  _id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  location: { lat?: number; lng?: number; address?: string };
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
  assignedTo?: { _id: string; username: string };
  complaintId?: { _id: string; description: string; imageUrl?: string };
  createdAt: string;
}

export function useJobs() {
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJobs = useCallback(async () => {
    try {
      const res = await API.get("/jobs");
      setJobs(res.data);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const submitBid = async (jobId: string, payload: { eta: string; cost?: number; note?: string }) => {
    const userId = localStorage.getItem("userId");
    await API.post("/bids", { jobId, contractorId: userId, eta: payload.eta, cost: payload.cost || 0, note: payload.note || "" });
    await fetchJobs();
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    await API.put(`/jobs/${jobId}/status`, { status });
    await fetchJobs();
  };

  const openJobs = jobs.filter((j) => j.status === "OPEN");
  const myJobs = jobs.filter((j) => j.assignedTo?._id === localStorage.getItem("userId"));

  return { jobs, openJobs, myJobs, loading, error, refetch: fetchJobs, submitBid, updateJobStatus };
}
