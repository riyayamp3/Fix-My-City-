import { Briefcase, Search, TrendingUp, Clock, ArrowRight, FileText, Award, CheckCircle, Send } from "lucide-react";
import { Link } from "react-router-dom";
import ReputationRing from "@/components/contractor/ReputationRing";
import { useJobs } from "@/hooks/contractor/useJobs";

const activityIcons = { bid_submitted: Send, job_awarded: Award, status_change: TrendingUp, job_completed: CheckCircle };
const activityColors = { bid_submitted: "text-primary", job_awarded: "text-success", status_change: "text-warning", job_completed: "text-success" };

const recentActivity = [
  { id: "A1", type: "bid_submitted" as const, message: "Bid submitted for Road Resurfacing – Whitefield", timestamp: "2 hours ago" },
  { id: "A2", type: "job_awarded" as const, message: "You won the bid for Drainage Upgrade – HSR Layout", timestamp: "1 day ago" },
  { id: "A3", type: "status_change" as const, message: "Manhole Cover Replacement status → In Progress", timestamp: "1 day ago" },
];

export default function ContractorDashboard() {
  const { openJobs, myJobs, loading } = useJobs();
  const name = localStorage.getItem("name") || "Contractor";

  const statCards = [
    { label: "Open Jobs", value: loading ? "..." : openJobs.length.toString(), icon: Search, color: "text-primary" },
    { label: "Awarded Jobs", value: loading ? "..." : myJobs.length.toString(), icon: Briefcase, color: "text-success" },
    { label: "Reputation", value: "87", icon: TrendingUp, color: "text-warning" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Welcome back, {name.split(" ")[0]}</h1>
        <p className="text-muted-foreground mt-1">Here's your work overview for today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={card.label} className="glass-card p-5 opacity-0 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
        <div className="glass-card p-5 flex items-center justify-center opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <ReputationRing score={87} size={100} strokeWidth={6} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/contractor/app/jobs" className="flex-1 glass-card p-4 flex items-center justify-between group hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Browse Open Jobs</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
        <Link to="/contractor/app/my-jobs" className="flex-1 glass-card p-4 flex items-center justify-between group hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-success" />
            <span className="font-semibold text-foreground">View My Jobs</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-success transition-colors" />
        </Link>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.map((item) => {
            const Icon = activityIcons[item.type];
            return (
              <div key={item.id} className="flex items-start gap-3">
                <Icon className={`w-4 h-4 mt-0.5 ${activityColors[item.type]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.timestamp}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
