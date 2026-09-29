import { useJobs } from "@/hooks/contractor/useJobs";
import { MapPin, Clock, Loader2 } from "lucide-react";
import SeverityBadge from "@/components/contractor/SeverityBadge";
import { toast } from "sonner";

const SEV_MAP: Record<string, "low" | "medium" | "high" | "critical"> = {
  LOW: "low", MEDIUM: "medium", HIGH: "high", CRITICAL: "critical",
};

export default function ContractorMyJobs() {
  const { myJobs, loading, updateJobStatus } = useJobs();

  const handleAdvance = async (jobId: string, currentStatus: string) => {
    const next = currentStatus === "ASSIGNED" ? "IN_PROGRESS" : "COMPLETED";
    try {
      await updateJobStatus(jobId, next);
      toast.success(`Status updated to ${next.replace("_", " ")}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" /> Loading your jobs...
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Jobs</h1>
        <p className="text-muted-foreground mt-1">Track and update your awarded jobs.</p>
      </div>
      {myJobs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No active jobs. Browse open jobs to place bids.</div>
      ) : (
        <div className="grid gap-4">
          {myJobs.map((job, i) => (
            <div key={job._id} className="glass-card p-6 opacity-0 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{job.title}</h3>
                    <SeverityBadge severity={SEV_MAP[job.severity?.toUpperCase()] || "medium"} />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location?.address || "—"}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    job.status === "COMPLETED" ? "bg-success/15 text-success" :
                    job.status === "IN_PROGRESS" ? "bg-warning/15 text-warning" :
                    "bg-primary/15 text-primary"
                  }`}>{job.status.replace("_", " ")}</span>
                  {job.status !== "COMPLETED" && (
                    <button onClick={() => handleAdvance(job._id, job.status)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-sm font-semibold transition-all">
                      {job.status === "ASSIGNED" ? "Start Work" : "Mark Complete"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
