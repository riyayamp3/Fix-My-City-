import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useComplaints, Complaint } from "@/hooks/useComplaints";
import { useJobs } from "@/hooks/useJobs";
import { Search, X, MapPin, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Complaints() {
  const { complaints, loading, error, refetch } = useComplaints();
  const { createJob } = useJobs();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Complaint | null>(null);

  const categories = ["all", ...new Set(complaints.map(c => c.category))];

  const filtered = complaints.filter(c => {
    if (
      search &&
      !c.description.toLowerCase().includes(search.toLowerCase()) &&
      !(c.location?.address ?? "").toLowerCase().includes(search.toLowerCase())
    ) return false;
    if (filterCategory !== "all" && c.category !== filterCategory) return false;
    if (filterSeverity !== "all" && c.severity !== filterSeverity) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return true;
  });

  const handleCreateJob = async () => {
    if (!selected) return;
    await createJob({
      complaintId: selected._id,
      title: selected.description,
      description: selected.description,
      category: selected.category,
      severity: selected.severity,
      location: selected.location,
    } as any);
    await refetch();
    setSelected(null);
  };

  return (
    <DashboardLayout title="Complaints">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-glow w-full pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input-glow text-sm min-w-[120px]">
              {categories.map(c => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
            </select>
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="input-glow text-sm min-w-[120px]">
              <option value="all">All Severity</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-glow text-sm min-w-[120px]">
              <option value="all">All Status</option>
              <option value="RECEIVED">Received</option>
              <option value="JOB_CREATED">Job Created</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div className="glass-card p-12 text-center text-muted-foreground text-sm">Loading complaints...</div>
        )}
        {error && (
          <div className="glass-card p-6 text-center text-destructive text-sm">{error}</div>
        )}

        {/* Table */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Issue</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 hidden md:table-cell">Category</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Severity</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 hidden lg:table-cell">Location</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map((c) => (
                    <tr
                      key={c._id}
                      onClick={() => setSelected(c)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={c.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{c.description}</p>
                            <p className="text-xs text-muted-foreground font-mono">{c._id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{c.category}</span>
                      </td>
                      <td className="p-4">
                        <span className={`badge-severity-${c.severity.toLowerCase()}`}>{c.severity}</span>
                      </td>
                      <td className="p-4">
                        <span className={`badge-status-${c.status === "IN_PROGRESS" ? "progress" : c.status.toLowerCase()}`}>{c.status}</span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {c.location?.address}
                        </span>
                      </td>
                      <td className="p-4">
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="p-12 text-center text-muted-foreground text-sm">No complaints found matching your criteria.</div>
            )}
          </motion.div>
        )}
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg z-50 bg-popover border-l border-border/50 overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">{selected._id}</span>
                  <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <img src={selected.imageUrl} alt="" className="w-full h-48 rounded-2xl object-cover" />

                <div>
                  <h2 className="text-lg font-bold text-foreground">{selected.description}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`badge-severity-${selected.severity.toLowerCase()}`}>{selected.severity}</span>
                    <span className={`badge-status-${selected.status === "IN_PROGRESS" ? "progress" : selected.status.toLowerCase()}`}>{selected.status}</span>
                  </div>
                </div>

                <div className="glass-card p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-foreground">{selected.location?.address}</span>
                  </div>
                  {selected.location?.lat != null && selected.location?.lng != null && (
                    <div className="text-xs text-muted-foreground">
                      {selected.location.lat.toFixed(4)}, {selected.location.lng.toFixed(4)}
                    </div>
                  )}
                </div>

                {selected.status === "RECEIVED" && (
                  <button onClick={handleCreateJob} className="btn-primary w-full flex items-center justify-center gap-2">
                    Create Job
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
