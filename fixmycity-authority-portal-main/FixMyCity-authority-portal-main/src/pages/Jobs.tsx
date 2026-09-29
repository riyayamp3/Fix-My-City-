import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useJobs, Job } from "@/hooks/useJobs";
import { useBids, Bid } from "@/hooks/useBids";
import { Clock, Users, CheckCircle2, Briefcase, UserCheck, X } from "lucide-react";
import { motion } from "framer-motion";

const columns: { status: Job["status"]; label: string; icon: React.ElementType }[] = [
  { status: "OPEN", label: "Open", icon: Briefcase },
  { status: "ASSIGNED", label: "Assigned", icon: UserCheck },
  { status: "IN_PROGRESS", label: "In Progress", icon: Clock },
  { status: "COMPLETED", label: "Completed", icon: CheckCircle2 },
];

const badgeClass: Record<Job["status"], string> = {
  OPEN: "badge-status-open",
  ASSIGNED: "badge-status-progress",
  IN_PROGRESS: "badge-status-progress",
  COMPLETED: "badge-status-completed",
};

export default function Jobs() {
  const { jobs, loading, error, refetch, assignJob } = useJobs();
  const { bids, loading: bidsLoading, fetchBids } = useBids();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const handleJobClick = (job: Job) => {
    if (job.status === "OPEN") {
      fetchBids(job._id);
      setSelectedJob(job);
    }
  };

  const handleAssign = async (bid: Bid) => {
    if (!selectedJob) return;
    await assignJob(selectedJob._id, bid.contractorId._id, bid._id);
    await refetch();
    setSelectedJob(null);
  };

  if (loading) {
    return (
      <DashboardLayout title="Jobs Board">
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading jobs...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Jobs Board">
        <div className="flex items-center justify-center h-64 text-destructive">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Jobs Board">
      <div className="max-w-7xl mx-auto flex gap-6">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6">
          {columns.map((col, ci) => {
            const colJobs = jobs.filter((j) => j.status === col.status);
            return (
              <motion.div
                key={col.status}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: ci * 0.05 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 px-1">
                  <col.icon className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full ml-auto">
                    {colJobs.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {colJobs.map((j) => (
                    <div
                      key={j._id}
                      className="glass-card-hover p-4 space-y-3 cursor-pointer"
                      onClick={() => handleJobClick(j)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground truncate max-w-[80px]">
                          {j._id}
                        </span>
                        <span className={badgeClass[j.status]}>{j.status}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{j.title}</p>
                      {j.assignedTo?.username && (
                        <p className="text-xs text-muted-foreground">
                          Assigned: {j.assignedTo.username}
                        </p>
                      )}
                    </div>
                  ))}
                  {colJobs.length === 0 && (
                    <div className="glass-card p-8 text-center text-sm text-muted-foreground">
                      No jobs
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {selectedJob && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.3 }}
            className="w-80 shrink-0 glass-card p-4 space-y-4 self-start"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Bids for Job</h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground truncate">{selectedJob.title}</p>

            {bidsLoading && (
              <p className="text-xs text-muted-foreground">Loading bids...</p>
            )}

            {!bidsLoading && bids.length === 0 && (
              <p className="text-xs text-muted-foreground">No bids yet.</p>
            )}

            {!bidsLoading && bids.map((bid) => (
              <div key={bid._id} className="glass-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {bid.contractorId.username}
                  </span>
                  <span className="text-xs text-muted-foreground">${bid.cost}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{bid.eta}</span>
                </div>
                {bid.note && (
                  <p className="text-xs text-muted-foreground">{bid.note}</p>
                )}
                <button
                  onClick={() => handleAssign(bid)}
                  className="w-full text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 hover:bg-primary/90 transition-colors"
                >
                  Assign
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
