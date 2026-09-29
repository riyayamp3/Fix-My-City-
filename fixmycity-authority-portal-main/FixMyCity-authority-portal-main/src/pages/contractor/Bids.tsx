import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function ContractorBids() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Bids</h1>
        <p className="text-muted-foreground mt-1">Track all your submitted bids in one place.</p>
      </div>
      <div className="text-center py-16 text-muted-foreground">
        <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>No bids yet. <Link to="/contractor/app/jobs" className="text-amber-500 hover:underline">Browse open jobs</Link> to get started.</p>
      </div>
    </div>
  );
}
