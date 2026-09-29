import { useState, useEffect } from "react";
import { MapPin, Clock, Camera, ChevronDown, ChevronUp } from "lucide-react";
import type { ActiveJob } from "@/data/mockData";
import { useComplaints } from "@/hooks/useComplaints";
import SeverityBadge from "@/components/SeverityBadge";
import StatusStepper from "@/components/StatusStepper";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const nextStatusMap: Record<string, string> = {
  accepted: "en_route",
  en_route: "in_progress",
  in_progress: "completed",
};

const nextStatusLabel: Record<string, string> = {
  accepted: "Mark En Route",
  en_route: "Start Work",
  in_progress: "Mark Completed",
};

export default function MyJobsPage() {
  const { activeJobs, updateStatus } = useComplaints();
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  
  useEffect(() => {
    setJobs(activeJobs);
  }, [activeJobs]);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) => setExpanded(expanded === id ? null : id);

  const advanceStatus = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const next = nextStatusMap[job.currentStatus];
    if (!next) return;

    try {
      // Map to backend status
      const backendStatus = next === "completed" ? "COMPLETED" : "IN_PROGRESS";
      await updateStatus(jobId, backendStatus);
      
      if (next === "completed") {
        toast.success("🎉 Job marked as Completed!", { description: "Great work! The authority will review." });
      } else {
        toast.info(`Status updated to ${next.replace("_", " ")}`);
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const addNote = (jobId: string) => {
    const note = noteInputs[jobId]?.trim();
    if (!note) return;
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, notes: [...j.notes, note] } : j))
    );
    setNoteInputs((prev) => ({ ...prev, [jobId]: "" }));
    toast.success("Note added");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Jobs</h1>
        <p className="text-muted-foreground mt-1">Track and update your awarded jobs.</p>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No active jobs. Browse open jobs to place bids.</div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job, i) => {
            const isExpanded = expanded === job.id;
            return (
              <div
                key={job.id}
                className="glass-card overflow-hidden opacity-0 animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Header */}
                <button
                  onClick={() => toggleExpand(job.id)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{job.title}</h3>
                      <SeverityBadge severity={job.severity} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000)}d left</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-6 border-t border-white/[0.04]">
                    {/* Status Stepper */}
                    <div className="pt-5">
                      <StatusStepper currentStatus={job.currentStatus} />
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                      <p className="text-sm text-foreground">{job.description}</p>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Ward</span>
                        <p className="text-foreground font-medium">{job.ward}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category</span>
                        <p className="text-foreground font-medium">{job.category}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Awarded</span>
                        <p className="text-foreground font-medium">{job.awardedDate}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Deadline</span>
                        <p className="text-foreground font-medium">{job.deadline}</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    {job.currentStatus !== "completed" && (
                      <Button
                        onClick={() => advanceStatus(job.id)}
                        className="w-full rounded-xl font-semibold hover-lift"
                      >
                        {nextStatusLabel[job.currentStatus]}
                      </Button>
                    )}

                    {job.currentStatus === "completed" && (
                      <div className="text-center py-3 rounded-xl bg-success/10 text-success font-semibold text-sm">
                        ✅ Job Completed — Awaiting Authority Review
                      </div>
                    )}

                    {/* Photo Upload */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Photo Evidence</h4>
                      <div
                        className="border-2 border-dashed border-white/[0.08] rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer"
                        onClick={() => toast.info("Photo upload coming soon")}
                      >
                        <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Click or drag photos here</p>
                        <p className="text-xs text-muted-foreground mt-1">Upload during/after work photos</p>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">On-Site Notes</h4>
                      {job.notes.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {job.notes.map((note, ni) => (
                            <div key={ni} className="text-sm text-foreground p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                              {note}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Add a note about the work..."
                          value={noteInputs[job.id] || ""}
                          onChange={(e) => setNoteInputs({ ...noteInputs, [job.id]: e.target.value })}
                          className="bg-white/[0.03] border-white/[0.06] resize-none"
                          rows={2}
                        />
                        <Button variant="outline" onClick={() => addNote(job.id)} className="self-end rounded-xl">
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
