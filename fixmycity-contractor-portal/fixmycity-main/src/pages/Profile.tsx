import { Mail, Phone, Calendar, IndianRupee, Briefcase, Clock, Star } from "lucide-react";
import { contractorProfile, myBids } from "@/data/mockData";
import ReputationRing from "@/components/ReputationRing";

const stats = [
  { label: "Timeliness", value: contractorProfile.timeliness, icon: Clock, color: "text-primary" },
  { label: "Quality", value: contractorProfile.quality, icon: Star, color: "text-warning" },
  { label: "Jobs Done", value: contractorProfile.jobsCompleted, icon: Briefcase, color: "text-success" },
];

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Contractor Profile</h1>
        <p className="text-muted-foreground mt-1">Your performance metrics and history.</p>
      </div>

      {/* Profile Header */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
          {contractorProfile.avatar}
        </div>
        <div className="text-center sm:text-left flex-1">
          <h2 className="text-xl font-bold text-foreground">{contractorProfile.name}</h2>
          <p className="text-muted-foreground text-sm">{contractorProfile.company}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contractorProfile.phone}</span>
            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{contractorProfile.email}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Since {contractorProfile.memberSince}</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Earnings</span>
          <span className="text-lg font-bold text-foreground flex items-center gap-1">
            {contractorProfile.totalEarnings}
          </span>
        </div>
      </div>

      {/* Reputation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-foreground mb-6">Reputation Score</h3>
          <ReputationRing score={contractorProfile.reputationScore} size={160} strokeWidth={10} />
          <p className="text-xs text-muted-foreground mt-4">Based on timeliness and quality metrics</p>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Performance Breakdown</h3>
          <div className="space-y-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    {stat.label}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {typeof stat.value === "number" && stat.label !== "Jobs Done" ? `${stat.value}%` : stat.value}
                  </span>
                </div>
                {stat.label !== "Jobs Done" && (
                  <div className="h-2 rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        stat.label === "Timeliness" ? "bg-primary" : "bg-warning"
                      }`}
                      style={{ width: `${stat.value}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bid History */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Bid History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 text-muted-foreground font-medium">Job</th>
                <th className="text-left py-3 text-muted-foreground font-medium">Amount</th>
                <th className="text-left py-3 text-muted-foreground font-medium">ETA</th>
                <th className="text-left py-3 text-muted-foreground font-medium">Date</th>
                <th className="text-right py-3 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {myBids.map((bid) => (
                <tr key={bid.id} className="border-b border-white/[0.03]">
                  <td className="py-3 text-foreground">{bid.jobTitle}</td>
                  <td className="py-3 text-foreground">{bid.amount ? `₹${bid.amount.toLocaleString()}` : "—"}</td>
                  <td className="py-3 text-muted-foreground">{bid.completionTime}</td>
                  <td className="py-3 text-muted-foreground">{bid.submittedDate}</td>
                  <td className="py-3 text-right">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      bid.status === "won" ? "bg-success/15 text-success" :
                      bid.status === "lost" ? "bg-destructive/15 text-destructive" :
                      "bg-warning/15 text-warning"
                    }`}>
                      {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
