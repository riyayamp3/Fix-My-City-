import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  accentColor: string;
  delay?: number;
}

export function StatCard({ title, value, change, changeType = "neutral", icon: Icon, accentColor, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="stat-card group"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            changeType === "positive" ? "bg-success/15 text-success" :
            changeType === "negative" ? "bg-destructive/15 text-destructive" :
            "bg-muted text-muted-foreground"
          }`}>
            {change}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{title}</div>
    </motion.div>
  );
}
