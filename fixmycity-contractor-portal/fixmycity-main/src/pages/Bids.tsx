import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { myBids } from "@/data/mockData";

export default function BidsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Bids</h1>
        <p className="text-muted-foreground mt-1">Track all your submitted bids in one place.</p>
      </div>

      {myBids.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No bids yet. <Link to="/jobs" className="text-primary hover:underline">Browse open jobs</Link> to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myBids.map((bid, i) => (
            <div key={bid.id} className="glass-card p-5 hover-lift opacity-0 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-semibold text-foreground">{bid.jobTitle}</h3>
                  <p className="text-sm text-muted-foreground">{bid.note}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {bid.amount && <span className="text-foreground font-medium">₹{bid.amount.toLocaleString()}</span>}
                    <span>ETA: {bid.completionTime}</span>
                    <span>{bid.submittedDate}</span>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${
                  bid.status === "won" ? "bg-success/15 text-success" :
                  bid.status === "lost" ? "bg-destructive/15 text-destructive" :
                  "bg-warning/15 text-warning"
                }`}>
                  {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
