import { useState } from "react";
import API from "@/services/api";

export interface Bid {
  _id: string;
  jobId: string;
  contractorId: { _id: string; username: string; role: string };
  eta: string;
  cost: number;
  note: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

export function useBids() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBids = async (jobId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.get<Bid[]>(`/bids/${jobId}`);
      setBids(data);
    } catch (err) {
      console.error("fetchBids error:", err);
      setError("Failed to fetch bids");
    } finally {
      setLoading(false);
    }
  };

  return { bids, loading, error, fetchBids };
}
