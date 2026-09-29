import {
  Briefcase,
  Search,
  TrendingUp,
  Clock,
  ArrowRight,
  FileText,
  Award,
  CheckCircle,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import { contractorProfile, recentActivity, myBids } from "@/data/mockData";
import ReputationRing from "@/components/ReputationRing";
import { useComplaints } from "@/hooks/useComplaints";

const activityIcons = {
  bid_submitted: Send,
  job_awarded: Award,
  status_change: TrendingUp,
  job_completed: CheckCircle,
};

const activityColors = {
  bid_submitted: "text-primary",
  job_awarded: "text-success",
  status_change: "text-warning",
  job_completed: "text-success",
};

export default function Dashboard() {
  const { openJobs, activeJobs } = useComplaints();

  const statCards = [
    {
      label: "Open Jobs Nearby",
      value: openJobs.length.toString(),
      icon: Search,
      color: "text-primary",
      glow: "glow-blue",
    },
    {
      label: "Active Bids",
      value: myBids.filter((b) => b.status === "pending").length.toString(),
      icon: FileText,
      color: "text-warning",
      glow: "",
    },
    {
      label: "Jobs In Progress",
      value: activeJobs.length.toString(),
      icon: Briefcase,
      color: "text-success",
      glow: "glow-green",
    },
  ];

  const deadlines = [...openJobs]
    .filter((j) => j.status === "open")
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Welcome back, {contractorProfile.name.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's your work overview for today.</p>
      </div>

      {/* Stats + Reputation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`glass-card p-5 hover-lift opacity-0 animate-fade-in ${card.glow}`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}

        <div className="glass-card p-5 flex items-center justify-center hover-lift opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <ReputationRing score={contractorProfile.reputationScore} size={100} strokeWidth={6} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/jobs"
          className="flex-1 glass-card p-4 flex items-center justify-between hover-lift group"
        >
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Browse Open Jobs</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
        <Link
          to="/my-jobs"
          className="flex-1 glass-card p-4 flex items-center justify-between hover-lift group"
        >
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-success" />
            <span className="font-semibold text-foreground">View My Jobs</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-success transition-colors" />
        </Link>
      </div>

      {/* Activity + Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((item) => {
              const Icon = activityIcons[item.type];
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Icon className={`w-4 h-4 ${activityColors[item.type]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.timestamp}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            Upcoming Deadlines
          </h2>
          <div className="space-y-3">
            {deadlines.map((job) => {
              const daysLeft = Math.ceil(
                (new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.ward}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      daysLeft <= 3
                        ? "bg-destructive/15 text-destructive"
                        : daysLeft <= 7
                        ? "bg-warning/15 text-warning"
                        : "bg-success/15 text-success"
                    }`}
                  >
                    {daysLeft}d left
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
