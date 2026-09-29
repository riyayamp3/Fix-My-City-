import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Wrench, Smartphone, MapPin, Briefcase, CheckCircle2,
  FileWarning, ArrowRight, ChevronRight, Users, Zap, BarChart3, X,
} from "lucide-react";

type PortalChoice = "authority" | "contractor" | null;
type AuthMode = "signin" | "signup";

function PortalModal({ portal, onClose }: { portal: PortalChoice; onClose: () => void }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  if (!portal) return null;

  const isAuthority = portal === "authority";

  const handleAuth = () => {
    onClose();
    if (isAuthority) {
      navigate(mode === "signin" ? "/login" : "/signup");
    } else {
      navigate(mode === "signin" ? "/contractor/login" : "/contractor/signup");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon + title */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isAuthority ? "bg-primary/10" : "bg-amber-500/10"
            }`}
          >
            {isAuthority ? (
              <Shield className={`w-6 h-6 text-primary`} />
            ) : (
              <Wrench className="w-6 h-6 text-amber-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {isAuthority ? "Authority Portal" : "Contractor Portal"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAuthority
                ? "Municipal administrator access"
                : "Contractor & bidding access"}
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl mb-6">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "signin"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "signup"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        <button
          onClick={handleAuth}
          className={`w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] ${
            isAuthority ? "bg-primary" : "bg-amber-500"
          }`}
        >
          {mode === "signin" ? "Sign In" : "Create Account"}
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {isAuthority
            ? "Restricted to Authority / Admin accounts"
            : "Restricted to Contractor accounts"}
        </p>
      </div>
    </div>
  );
}

export default function Landing() {
  const [activePortal, setActivePortal] = useState<PortalChoice>(null);

  const steps = [
    {
      icon: Smartphone,
      step: "01",
      title: "Citizen Reports",
      desc: "Quick form with auto-GPS and photo. AI auto-fills category and severity.",
      color: "text-primary",
      bg: "bg-primary/8",
    },
    {
      icon: Shield,
      step: "02",
      title: "Authority Triages",
      desc: "Admin reviews on a live map and creates structured work orders in one click.",
      color: "text-purple-600",
      bg: "bg-purple-500/8",
    },
    {
      icon: Wrench,
      step: "03",
      title: "Contractors Bid",
      desc: "Contractors see open jobs and submit bids with cost and ETA.",
      color: "text-amber-600",
      bg: "bg-amber-500/8",
    },
    {
      icon: CheckCircle2,
      step: "04",
      title: "Issue Resolved",
      desc: "Contractor completes work, uploads after-photos. Citizen gets notified.",
      color: "text-green-600",
      bg: "bg-green-500/8",
    },
  ];

  const roles = [
    {
      icon: Smartphone,
      title: "Citizen",
      platform: "Mobile App",
      color: "primary",
      features: [
        "Report issues with photo + GPS",
        "Track complaint lifecycle",
        "Real-time status notifications",
        "View hotspot map",
        "Earn Impact Points",
      ],
    },
    {
      icon: Shield,
      title: "Authority / Admin",
      platform: "Web Dashboard",
      color: "purple",
      features: [
        "View and triage all complaints",
        "Create jobs from complaints",
        "Manage contractor bids",
        "Live map command center",
        "Analytics and hotspot detection",
      ],
    },
    {
      icon: Wrench,
      title: "Contractor",
      platform: "Web Portal",
      color: "amber",
      features: [
        "Browse open municipal jobs",
        "Submit bids with cost and ETA",
        "Track awarded jobs",
        "Upload progress photos",
        "Build reputation score",
      ],
    },
  ];

  const stats = [
    { icon: Users, value: "3", label: "Platforms", sub: "Web + Mobile" },
    { icon: Zap, value: "10s", label: "To Report", sub: "Quick form" },
    { icon: MapPin, value: "Live", label: "Tracking", sub: "Real-time status" },
    { icon: BarChart3, value: "AI", label: "Powered", sub: "Auto-categorize" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground">FixMyCity</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#roles" className="hover:text-foreground transition-colors">Roles</a>
            <a href="#portals" className="hover:text-foreground transition-colors">Portals</a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePortal("authority")}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              Authority
            </button>
            <button
              onClick={() => setActivePortal("contractor")}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              Contractor
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-24 md:py-36 px-6">
        {/* Subtle background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-8">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Civic Issue Management Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight tracking-tight">
            Fix Your City,{" "}
            <span className="text-primary">Together</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Report civic issues, track resolutions in real-time, and connect
            citizens, authorities, and contractors on one unified platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setActivePortal("authority")}
              className="group flex items-center gap-2.5 px-7 py-3.5 bg-primary text-white rounded-xl font-semibold text-base transition-all hover:brightness-110 hover:-translate-y-0.5 shadow-lg shadow-primary/20"
            >
              <Shield className="w-5 h-5" />
              Authority Portal
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => setActivePortal("contractor")}
              className="group flex items-center gap-2.5 px-7 py-3.5 bg-card border border-border text-foreground rounded-xl font-semibold text-base transition-all hover:bg-muted hover:-translate-y-0.5"
            >
              <Wrench className="w-5 h-5 text-amber-600" />
              Contractor Portal
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <p className="mt-5 text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <Smartphone className="w-4 h-4" />
            Citizens — use the FixMyCity mobile app
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-border/50 py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-3xl font-black text-foreground mb-0.5">{s.value}</div>
              <div className="text-sm font-semibold text-foreground">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Workflow</p>
            <h2 className="text-4xl font-black text-foreground mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              From pothole to patch — a seamless end-to-end workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div
                key={s.step}
                className="glass-card p-6 relative group hover:-translate-y-1 transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center mb-4`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className="text-xs font-mono text-muted-foreground mb-2">{s.step}</div>
                <h3 className="text-base font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 bg-background border border-border rounded-full items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section id="roles" className="py-24 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Roles</p>
            <h2 className="text-4xl font-black text-foreground mb-3">Three Roles, One Platform</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Every stakeholder has a tailored experience built for their workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((r) => {
              const Icon = r.icon;
              const colorMap: Record<string, string> = {
                primary: "bg-primary/8 text-primary",
                purple: "bg-purple-500/8 text-purple-600",
                amber: "bg-amber-500/8 text-amber-600",
              };
              const badgeMap: Record<string, string> = {
                primary: "bg-primary/10 text-primary",
                purple: "bg-purple-500/10 text-purple-600",
                amber: "bg-amber-500/10 text-amber-600",
              };
              const dotMap: Record<string, string> = {
                primary: "bg-primary",
                purple: "bg-purple-500",
                amber: "bg-amber-500",
              };
              return (
                <div key={r.title} className="glass-card p-7">
                  <div className={`w-12 h-12 rounded-xl ${colorMap[r.color]} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${badgeMap[r.color]}`}>
                    {r.platform}
                  </span>
                  <h3 className="text-xl font-bold text-foreground mb-5">{r.title}</h3>
                  <ul className="space-y-2.5">
                    {r.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dotMap[r.color]}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Portals CTA ── */}
      <section id="portals" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Get Started</p>
            <h2 className="text-4xl font-black text-foreground mb-3">Access Your Portal</h2>
            <p className="text-muted-foreground">Sign in or create an account to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Authority */}
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-5">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Authority Portal</h3>
              <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
                For municipal administrators to manage complaints, create jobs, and oversee resolutions.
              </p>
              <button
                onClick={() => setActivePortal("authority")}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Sign In / Create Account
              </button>
            </div>

            {/* Contractor */}
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/8 flex items-center justify-center mx-auto mb-5">
                <Wrench className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Contractor Portal</h3>
              <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
                For contractors to discover open jobs, submit bids, and manage awarded work.
              </p>
              <button
                onClick={() => setActivePortal("contractor")}
                className="w-full py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Wrench className="w-4 h-4" />
                Sign In / Create Account
              </button>
            </div>
          </div>

          {/* Mobile */}
          <div className="glass-card p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-green-500/8 flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">Citizen Mobile App</h3>
            <p className="text-sm text-muted-foreground">
              Download the FixMyCity app to report issues, track complaints, and earn Impact Points.
              Built with React Native + Expo.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-bold text-foreground">FixMyCity</span>
            <span className="text-muted-foreground text-sm">— Helping build better cities, together.</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Zap className="w-3.5 h-3.5" />
            Built for Ignition Hackverse Hackathon
          </div>
        </div>
      </footer>

      <PortalModal portal={activePortal} onClose={() => setActivePortal(null)} />
    </div>
  );
}
