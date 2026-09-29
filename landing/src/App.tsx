import React, { useState, useEffect } from "react";

const AUTHORITY_URL = "http://localhost:8080";
const CONTRACTOR_URL = "http://localhost:5174";

// ─── Portal Modal ────────────────────────────────────────────────────────────
type PortalType = "authority" | "contractor" | null;

function PortalModal({ portal, onClose }: { portal: PortalType; onClose: () => void }) {
  if (!portal) return null;
  const isAuthority = portal === "authority";
  const base = isAuthority ? AUTHORITY_URL : CONTRACTOR_URL;
  const accent = isAuthority ? "#3b82f6" : "#f59e0b";
  const icon = isAuthority ? "🏛️" : "🔧";
  const title = isAuthority ? "Authority Portal" : "Contractor Portal";
  const desc = isAuthority
    ? "For municipal administrators to manage complaints, create jobs, and oversee resolutions."
    : "For contractors to discover open jobs, submit bids, and manage awarded work.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl p-8 text-center"
        style={{
          background: "rgba(15,20,40,0.95)",
          border: `1px solid ${accent}30`,
          boxShadow: `0 0 60px ${accent}20, 0 20px 60px rgba(0,0,0,0.5)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors text-xl"
        >
          ✕
        </button>

        {/* Icon */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5"
          style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
        >
          {icon}
        </div>

        <h2 className="text-2xl font-black text-white mb-2">{title}</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">{desc}</p>

        <div className="flex flex-col gap-3">
          <a
            href={`${base}/login`}
            className="w-full py-3.5 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: accent, boxShadow: `0 4px 20px ${accent}40` }}
          >
            Sign In
          </a>
          <a
            href={`${base}/signup`}
            className="w-full py-3.5 rounded-2xl font-semibold text-slate-300 transition-all hover:text-white hover:-translate-y-0.5"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Create Account
          </a>
        </div>

        <p className="text-xs text-slate-600 mt-5">
          {isAuthority ? "Restricted to Authority / Admin accounts" : "Restricted to Contractor accounts"}
        </p>
      </div>
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function NavBar({ onPortalClick }: { onPortalClick: (p: PortalType) => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(10,15,30,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">🏙️</div>
          <span className="text-xl font-black text-white tracking-tight">FixMyCity</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          {["how-it-works", "roles", "portals"].map((id) => (
            <a key={id} href={`#${id}`} className="hover:text-white transition-colors capitalize">
              {id.replace("-", " ")}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPortalClick("authority")}
            className="text-sm px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:border-blue-500 hover:text-white transition-all"
          >
            🏛️ Authority
          </button>
          <button
            onClick={() => onPortalClick("contractor")}
            className="text-sm px-4 py-2 rounded-xl font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
          >
            🔧 Contractor
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({ onPortalClick }: { onPortalClick: (p: PortalType) => void }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.15) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ background: "rgba(139,92,246,0.08)" }} />
        <div className="absolute top-1/3 left-0 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ background: "rgba(59,130,246,0.06)" }} />
      </div>

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto pt-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-sm text-blue-300"
          style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <span className="w-2 h-2 bg-green-400 rounded-full" style={{ animation: "pulse 2s infinite" }} />
          Civic Issue Management Platform · Ignition Hackverse
        </div>

        {/* Headline */}
        <h1 className="text-7xl md:text-9xl font-black mb-6 leading-[0.9] tracking-tight">
          <span className="text-white">Fix Your</span>
          <br />
          <span style={{
            background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            City Together
          </span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-14 leading-relaxed">
          Report civic issues, track resolutions in real-time, and connect citizens,
          authorities, and contractors on one unified platform.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <button
            onClick={() => onPortalClick("authority")}
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg text-white transition-all duration-300 hover:-translate-y-1"
            style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              boxShadow: "0 0 30px rgba(37,99,235,0.3)",
            }}
          >
            <span className="text-xl">🏛️</span>
            Authority Portal
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
          <button
            onClick={() => onPortalClick("contractor")}
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg text-white transition-all duration-300 hover:-translate-y-1"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
            }}
          >
            <span className="text-xl">🔧</span>
            Contractor Portal
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        <p className="text-sm text-slate-500">📱 Citizens — use the FixMyCity mobile app</p>

        {/* Floating cards */}
        <div className="mt-20 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { emoji: "📍", label: "Issue Reported", sub: "MG Road pothole", color: "#3b82f6" },
            { emoji: "⚡", label: "Job Created", sub: "Assigned to contractor", color: "#a78bfa" },
            { emoji: "✅", label: "Resolved", sub: "Citizen notified", color: "#34d399" },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl p-4 text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${c.color}20`,
                animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}>
              <div className="text-2xl mb-1">{c.emoji}</div>
              <div className="text-xs font-semibold text-white">{c.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600 text-xs">
        <span>Scroll to explore</span>
        <div className="w-px h-8" style={{ background: "linear-gradient(to bottom, #64748b, transparent)" }} />
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function StatsSection() {
  const stats = [
    { value: "3", label: "Platforms", sub: "Web + Mobile", color: "#3b82f6" },
    { value: "10s", label: "To Report", sub: "Quick form", color: "#a78bfa" },
    { value: "Live", label: "Tracking", sub: "Real-time status", color: "#34d399" },
    { value: "AI", label: "Powered", sub: "Auto-categorize", color: "#f59e0b" },
  ];
  return (
    <section className="py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-5xl font-black mb-1" style={{
              background: `linear-gradient(135deg, ${s.color}, ${s.color}99)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>{s.value}</div>
            <div className="text-white font-semibold">{s.label}</div>
            <div className="text-slate-500 text-sm">{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    { icon: "📸", step: "01", title: "Citizen Reports", desc: "Snap a photo. AI auto-detects the issue, fills category and severity. Submit in seconds.", color: "#3b82f6" },
    { icon: "🏛️", step: "02", title: "Authority Triages", desc: "Admin reviews on a live map, creates structured work orders with one click.", color: "#a78bfa" },
    { icon: "🔧", step: "03", title: "Contractors Bid", desc: "Contractors see open jobs, submit bids with cost and ETA. Authority picks the best.", color: "#f59e0b" },
    { icon: "✅", step: "04", title: "Issue Resolved", desc: "Contractor completes work, uploads after-photos. Citizen gets notified.", color: "#34d399" },
  ];
  return (
    <section id="how-it-works" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-block text-xs font-bold uppercase tracking-widest text-blue-400 mb-4 px-3 py-1 rounded-full"
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
            Workflow
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-white mb-4">How It Works</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">From pothole to patch — a seamless end-to-end workflow</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.step} className="relative rounded-3xl p-7 transition-all duration-300 hover:-translate-y-2 group"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${s.color}20` }}>
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `radial-gradient(circle at 50% 0%, ${s.color}08, transparent 70%)` }} />
              <div className="relative z-10">
                <div className="text-4xl mb-5">{s.icon}</div>
                <div className="text-xs font-mono mb-2" style={{ color: s.color }}>{s.step}</div>
                <h3 className="text-lg font-bold text-white mb-3">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-slate-700 text-xl">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Roles ────────────────────────────────────────────────────────────────────
function RolesSection() {
  const roles = [
    {
      icon: "👤", title: "Citizen", platform: "Mobile App", color: "#3b82f6",
      features: ["Report issues with photo + GPS", "Track complaint lifecycle", "Get real-time notifications", "View hotspot map", "Earn Impact Points"],
    },
    {
      icon: "🏛️", title: "Authority / Admin", platform: "Web Dashboard", color: "#a78bfa",
      features: ["View & triage all complaints", "Create jobs from complaints", "Manage contractor bids", "Live map command center", "Analytics & hotspot detection"],
    },
    {
      icon: "🔧", title: "Contractor", platform: "Web Portal", color: "#f59e0b",
      features: ["Browse open municipal jobs", "Submit bids with cost & ETA", "Track awarded jobs", "Upload progress photos", "Build reputation score"],
    },
  ];
  return (
    <section id="roles" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-block text-xs font-bold uppercase tracking-widest text-purple-400 mb-4 px-3 py-1 rounded-full"
            style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)" }}>
            Roles
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-white mb-4">Three Roles, One Platform</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Every stakeholder has a tailored experience built for their workflow</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((r) => (
            <div key={r.title} className="rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 group"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${r.color}20` }}>
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 0%, ${r.color}06, transparent 70%)` }} />
              <div className="text-5xl mb-4">{r.icon}</div>
              <div className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4"
                style={{ background: `${r.color}15`, color: r.color, border: `1px solid ${r.color}25` }}>
                {r.platform}
              </div>
              <h3 className="text-2xl font-black text-white mb-6">{r.title}</h3>
              <ul className="space-y-3">
                {r.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-slate-300 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: r.color }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Portals CTA ──────────────────────────────────────────────────────────────
function PortalsSection({ onPortalClick }: { onPortalClick: (p: PortalType) => void }) {
  return (
    <section id="portals" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-block text-xs font-bold uppercase tracking-widest text-green-400 mb-4 px-3 py-1 rounded-full"
            style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
            Get Started
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-white mb-4">Access Your Portal</h2>
          <p className="text-slate-400 text-lg">Sign in or create an account to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Authority */}
          <div className="rounded-3xl p-8 text-center transition-all duration-300 hover:-translate-y-2"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>🏛️</div>
            <h3 className="text-2xl font-black text-white mb-2">Authority Portal</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              For municipal administrators to manage complaints, create jobs, and oversee resolutions.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => onPortalClick("authority")}
                className="w-full py-3.5 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}>
                Sign In / Sign Up
              </button>
            </div>
          </div>

          {/* Contractor */}
          <div className="rounded-3xl p-8 text-center transition-all duration-300 hover:-translate-y-2"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>🔧</div>
            <h3 className="text-2xl font-black text-white mb-2">Contractor Portal</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              For contractors to discover open jobs, submit bids, and manage awarded work.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => onPortalClick("contractor")}
                className="w-full py-3.5 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#d97706,#b45309)", boxShadow: "0 4px 20px rgba(217,119,6,0.3)" }}>
                Sign In / Sign Up
              </button>
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="rounded-3xl p-6 text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <div className="text-4xl mb-3">📱</div>
          <h3 className="text-xl font-bold text-white mb-2">Citizen Mobile App</h3>
          <p className="text-slate-400 text-sm">
            Download the FixMyCity app to report issues, track your complaints, and earn Impact Points.
            Built with React Native + Expo.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-12 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🏙️</span>
          <span className="font-black text-white">FixMyCity</span>
          <span className="text-slate-600 text-sm ml-2">— Helping build better cities, together.</span>
        </div>
        <div className="text-slate-600 text-sm">Built for Ignition Hackverse Hackathon 🚀</div>
      </div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [activePortal, setActivePortal] = useState<PortalType>(null);

  return (
    <div className="min-h-screen" style={{ background: "#080d1a" }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <NavBar onPortalClick={setActivePortal} />
      <HeroSection onPortalClick={setActivePortal} />
      <StatsSection />
      <HowItWorksSection />
      <RolesSection />
      <PortalsSection onPortalClick={setActivePortal} />
      <Footer />

      <PortalModal portal={activePortal} onClose={() => setActivePortal(null)} />
    </div>
  );
}
