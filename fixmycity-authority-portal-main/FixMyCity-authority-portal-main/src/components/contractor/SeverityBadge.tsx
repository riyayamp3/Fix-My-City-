import { cn } from "@/lib/utils";

type Severity = "low" | "medium" | "high" | "critical";

const config: Record<Severity, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-success/15 text-success border-success/20" },
  medium: { label: "Medium", className: "bg-warning/15 text-warning border-warning/20" },
  high: { label: "High", className: "bg-destructive/15 text-destructive border-destructive/20" },
  critical: { label: "Critical", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const { label, className } = config[severity] ?? config.medium;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", className)}>
      {label}
    </span>
  );
}
