import { useState, useEffect } from "react";
import API from "@/services/api";

export interface Job {
  _id: string;
  complaintId: { _id: string; description: string; category: string };
  title: string;
  description: string;
  category: string;
  severity: string;
  location: { lat: number; lng: number; address: string };
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
  assignedTo?: { _id: string; username: string; role: string };
  createdAt: string;
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.get<Job[]>("/jobs");
      setJobs(data);
    } catch (err) {
      console.error("useJobs fetch error:", err);
      setError("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const createJob = async (payload: Omit<Job, "_id" | "status" | "createdAt" | "assignedTo">) => {
    const { data } = await API.post<Job>("/jobs", payload);
    return data;
  };

  const assignJob = async (jobId: string, contractorId: string, bidId: string) => {
    const { data } = await API.put<Job>(`/jobs/${jobId}/assign`, { contractorId, bidId });
    return data;
  };

  const updateJobStatus = async (jobId: string, status: Job["status"]) => {
    const { data } = await API.put<Job>(`/jobs/${jobId}/status`, { status });
    return data;
  };

  return { jobs, loading, error, refetch: fetchJobs, createJob, assignJob, updateJobStatus };
}
