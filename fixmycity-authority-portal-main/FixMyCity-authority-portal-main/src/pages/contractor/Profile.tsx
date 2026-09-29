import { Mail, Phone, Calendar, Briefcase, Clock, Star } from "lucide-react";
import ReputationRing from "@/components/contractor/ReputationRing";

export default function ContractorProfile() {
  const name = localStorage.getItem("name") || "Contractor";
  const username = localStorage.getItem("userId") ? "contractor" : "—";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const stats = [
    { label: "Timeliness", value: 92, icon: Clock, color: "text-primary", bar: true },
    { label: "Quality", value: 85, icon: Star, color: "text-warning", bar: true },
    { label: "Jobs Done", value: 34, icon: Briefcase, color: "text-success", bar: false },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Contractor Profile</h1>
        <p className="text-muted-foreground mt-1">Your performance metrics and history.</p>
      </div>

      <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-600 text-2xl font-bold">
          {initials}
        </div>
        <div className="text-center sm:text-left flex-1">
          <h2 className="text-xl font-bold text-foreground">{name}</h2>
          <p className="text-muted-foreground text-sm">Contractor Account</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-foreground mb-6">Reputation Score</h3>
          <ReputationRing score={87} size={160} strokeWidth={10} />
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
                    {stat.bar ? `${stat.value}%` : stat.value}
                  </span>
                </div>
                {stat.bar && (
                  <div className="h-2 rounded-full bg-muted">
                    <div className={`h-full rounded-full transition-all duration-1000 ${stat.label === "Timeliness" ? "bg-primary" : "bg-warning"}`}
                      style={{ width: `${stat.value}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
