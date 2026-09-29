import { useState, useEffect } from "react";
import API from "@/services/api";

export interface Complaint {
  _id: string;
  userId: { _id: string; username: string; role: string };
  description: string;
  imageUrl: string;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  location: { lat: number; lng: number; address: string };
  status: "RECEIVED" | "JOB_CREATED" | "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
}

export function useComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaints = async () => {
    try {
      setError(null);
      const res = await API.get("/complaints");
      setComplaints(res.data);
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
      setError("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await API.patch(`/complaints/${id}/status`, { status });
      await fetchComplaints();
    } catch (err) {
      console.error("Failed to update status:", err);
      throw err;
    }
  };

  return { complaints, loading, error, refetch: fetchComplaints, updateStatus };
}
