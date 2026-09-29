import { useState } from "react";
import { MapPin, Clock, Tag, Search as SearchIcon, Loader2 } from "lucide-react";
import SeverityBadge from "@/components/contractor/SeverityBadge";
import { useJobs, type ApiJob } from "@/hooks/contractor/useJobs";
import { toast } from "sonner";

const tabs = ["Open Jobs", "My Bids", "Awarded to Me"] as const;
const SEV_MAP: Record<string, "low" | "medium" | "high" | "critical"> = {
  LOW: "low", MEDIUM: "medium", HIGH: "high", CRITICAL: "critical",
};

export default function ContractorJobs() {
  const { openJobs, myJobs, loading, error, submitBid } = useJobs();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Open Jobs");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [bidJob, setBidJob] = useState<ApiJob | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidTime, setBidTime] = useState("");
  const [bidNote, setBidNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = openJobs.filter((j) => {
    const loc = j.location?.address || "";
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !loc.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter !== "all" && j.category !== catFilter) return false;
    return true;
  });

  const handleSubmitBid = async () => {
    if (!bidTime) { toast.error("Please select a completion time"); return; }
    if (!bidJob) return;
    setSubmitting(true);
    try {
      await submitBid(bidJob._id, { eta: bidTime, cost: bidAmount ? parseFloat(bidAmount) : 0, note: bidNote });
      toast.success("Bid submitted!", { description: `Your bid for "${bidJob.title}" has been placed.` });
      setBidJob(null); setBidAmount(""); setBidTime(""); setBidNote("");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to submit bid");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full bg-input border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Job Discovery</h1>
        <p className="text-muted-foreground mt-1">Find and bid on municipal repair jobs.</p>
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Open Jobs" && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input placeholder="Search jobs or locations..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
              className="bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="all">All Categories</option>
              {["Roads", "Drainage", "Electrical", "Water", "Sanitation", "Parks"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading jobs...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">{error}</div>
          ) : (
            <div className="grid gap-4">
              {filtered.map((job, i) => (
                <div key={job._id} className="glass-card p-5 hover:-translate-y-0.5 transition-all opacity-0 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{job.title}</h3>
                        <SeverityBadge severity={SEV_MAP[job.severity?.toUpperCase()] || "medium"} />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{job.category}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location?.address || "Location not specified"}</span>
                        <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{job.category}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button onClick={() => setBidJob(job)}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-semibold text-sm transition-all shrink-0">
                      Place Bid
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {openJobs.length === 0 ? "No open jobs yet. Check back soon." : "No jobs match your filters."}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "Awarded to Me" && (
        <div className="grid gap-4">
          {myJobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No jobs awarded yet. Place bids to get started.</div>
          ) : myJobs.map((job, i) => (
            <div key={job._id} className="glass-card p-5 opacity-0 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">{job.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location?.address || "—"}</span>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-success/15 text-success shrink-0">{job.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "My Bids" && (
        <div className="text-center py-12 text-muted-foreground">Bid history coming soon.</div>
      )}

      {/* Bid Modal */}
      {bidJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setBidJob(null)}>
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="text-lg font-bold text-foreground">Place Bid</h3>
              <p className="text-sm text-muted-foreground">{bidJob.title}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proposed Amount (optional)</label>
              <input placeholder="Enter amount" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completion Time *</label>
              <select value={bidTime} onChange={(e) => setBidTime(e.target.value)}
                className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20">
                <option value="">Select timeframe</option>
                {["1 day", "2 days", "3 days", "5 days", "1 week", "2 weeks"].map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
              <textarea placeholder="Brief note about your approach..." value={bidNote} onChange={(e) => setBidNote(e.target.value)}
                className={`${inputClass} resize-none`} rows={3} />
            </div>
            <button onClick={handleSubmitBid} disabled={submitting}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : "Submit Bid"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
