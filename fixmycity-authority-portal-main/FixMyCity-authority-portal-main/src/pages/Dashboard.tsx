import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { FileWarning, Briefcase, CheckCircle2, AlertTriangle, TrendingUp, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useComplaints } from "@/hooks/useComplaints";
import { useJobs } from "@/hooks/useJobs";

export default function Dashboard() {
  const { complaints } = useComplaints();
  const { jobs } = useJobs();

  const recentComplaints = complaints.slice(0, 5).map(c => ({
    id: c._id,
    image: c.imageUrl || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=100",
    title: c.description || c.category || "Issue",
    location: c.location?.address || "Unknown Location",
    severity: c.severity.toLowerCase(),
    status: c.status === "IN_PROGRESS" ? "progress" : c.status.toLowerCase()
  }));

  const activeJobsList = jobs.filter(j => j.status !== "COMPLETED").slice(0, 4).map(j => ({
    id: j._id,
    status: j.status === "IN_PROGRESS" ? "progress" : j.status.toLowerCase(),
    complaintTitle: j.title,
    bidsCount: 0,
    eta: j.createdAt
  }));

  const liveStats = {
    totalComplaints: complaints.length.toString(),
    activeJobs: activeJobsList.length.toString(),
    completedIssues: complaints.filter(c => c.status === "COMPLETED").length.toString(),
    criticalAlerts: complaints.filter(c => c.severity === "HIGH" && c.status !== "COMPLETED").length.toString(),
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Complaints" value={liveStats.totalComplaints} change="+12%" changeType="negative" icon={FileWarning} accentColor="#3B82F6" delay={0} />
          <StatCard title="Active Jobs" value={liveStats.activeJobs} change="+3 today" changeType="neutral" icon={Briefcase} accentColor="#F59E0B" delay={0.05} />
          <StatCard title="Completed Issues" value={liveStats.completedIssues} change="+8%" changeType="positive" icon={CheckCircle2} accentColor="#10B981" delay={0.1} />
          <StatCard title="Critical Alerts" value={liveStats.criticalAlerts} change="−2" changeType="positive" icon={AlertTriangle} accentColor="#EF4444" delay={0.15} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recent complaints */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-3 glass-card p-0 overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h3 className="text-sm font-semibold text-foreground">Recent Complaints</h3>
              <a href="/complaints" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                View all <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
            <div className="divide-y divide-border/30">
              {recentComplaints.map((c) => (
                <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <img src={c.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.location}</p>
                  </div>
                  <span className={`badge-severity-${c.severity}`}>{c.severity}</span>
                  <span className={`badge-status-${c.status === "in-progress" ? "progress" : c.status}`}>{c.status}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Active jobs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="lg:col-span-2 glass-card p-0 overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h3 className="text-sm font-semibold text-foreground">Active Jobs</h3>
              <a href="/jobs" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                View all <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
            <div className="divide-y divide-border/30">
              {activeJobsList.map((j) => (
                <div key={j.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-muted-foreground">{j.id}</span>
                    <span className={`badge-status-${j.status === "in-progress" ? "progress" : j.status}`}>{j.status}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{j.complaintTitle}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{j.bidsCount} bids</span>
                    <span>ETA: {new Date(j.eta).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Trend card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Resolution Trend</h3>
          </div>
          <div className="flex items-end gap-1 h-24">
            {[35, 48, 42, 55, 60, 52, 68, 72, 65, 78, 82, 75, 88, 92, 85, 95, 89, 98, 92, 100].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-primary/20 hover:bg-primary/40 transition-colors relative group"
                style={{ height: `${h}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-primary font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {h}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground/60">
            <span>Mar 1</span>
            <span>Mar 15</span>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
