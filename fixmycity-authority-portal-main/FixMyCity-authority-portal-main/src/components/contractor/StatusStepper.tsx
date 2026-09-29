import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const steps = ["accepted", "en_route", "in_progress", "completed"] as const;
const labels = ["Accepted", "En Route", "In Progress", "Completed"];

interface StatusStepperProps {
  currentStatus: (typeof steps)[number];
}

export default function StatusStepper({ currentStatus }: StatusStepperProps) {
  const currentIndex = steps.indexOf(currentStatus);
  return (
    <div className="flex items-center w-full gap-1">
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                done ? "bg-success border-success text-success-foreground" :
                active ? "bg-primary/20 border-primary text-primary" :
                "bg-muted border-border text-muted-foreground")}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn("text-[10px] mt-1 font-medium",
                done ? "text-success" : active ? "text-primary" : "text-muted-foreground")}>
                {labels[i]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-0.5 flex-1 mx-1 rounded-full -mt-4", done ? "bg-success" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
