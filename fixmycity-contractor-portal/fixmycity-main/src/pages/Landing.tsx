import { useNavigate } from "react-router-dom";
import { Wrench, Shield, ChevronRight, Zap, MapPin, Users, BarChart3, CheckCircle2, Smartphone, Briefcase, FileText } from "lucide-react";

export default function ContractorLanding() {
  const navigate = useNavigate();

  const features = [
    { icon: MapPin, title: "Browse Open Jobs", desc: "See all open municipal jobs in your area with location, category, and severity details." },
    { icon: FileText, title: "Submit Bids", desc: "Place bids with your proposed cost and ETA. Track all your submitted bids in one place." },
    { icon: Briefcase, title: "Manage Your Work", desc: "Track awarded jobs, update status, and upload progress photos from the field." },
    { icon: BarChart3, title: "Build Reputation", desc: "Your timeliness and quality scores build a reputation that helps you win more jobs." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-lg font-bold text-foreground">FixMyCity</span>
            <span className="text-xs text-muted-foreground ml-1 hidden sm:block">Contractor Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              Sign In
            </button>
            <button onClick={() => navigate("/signup")}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition-all">
              Create Account
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/8 border border-amber-500/15 rounded-full px-4 py-1.5 text-sm text-amber-600 font-medium mb-8">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            Contractor Portal — FixMyCity
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-foreground mb-5 leading-tight tracking-tight">
            Discover Jobs,<br />
            <span className="text-amber-600">Win Contracts</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Browse open municipal jobs, submit competitive bids, and manage your awarded work — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => navigate("/signup")}
              className="group flex items-center gap-2.5 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-semibold text-base transition-all hover:-translate-y-0.5 shadow-lg shadow-amber-500/20">
              <Wrench className="w-5 h-5" />
              Get Started
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button onClick={() => navigate("/login")}
              className="flex items-center gap-2.5 px-7 py-3.5 bg-card border border-border text-foreground rounded-xl font-semibold text-base transition-all hover:bg-muted hover:-translate-y-0.5">
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">Features</p>
            <h2 className="text-3xl font-black text-foreground mb-3">Everything You Need</h2>
            <p className="text-muted-foreground">A single pane for all your municipal work</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((f) => (
              <div key={f.title} className="glass-card p-6 flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-500/8 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center glass-card p-12">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/8 flex items-center justify-center mx-auto mb-5">
            <Wrench className="w-7 h-7 text-amber-600" />
          </div>
          <h2 className="text-3xl font-black text-foreground mb-3">Ready to Start?</h2>
          <p className="text-muted-foreground mb-8">Create your contractor account and start bidding on open jobs today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate("/signup")}
              className="px-7 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-semibold transition-all">
              Create Account
            </button>
            <button onClick={() => navigate("/login")}
              className="px-7 py-3 bg-card border border-border text-foreground rounded-xl font-semibold transition-all hover:bg-muted">
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-foreground">FixMyCity</span>
            <span className="text-muted-foreground text-sm">Contractor Portal</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Zap className="w-3.5 h-3.5" />
            Built for Ignition Hackverse Hackathon
          </div>
        </div>
      </footer>
    </div>
  );
}
