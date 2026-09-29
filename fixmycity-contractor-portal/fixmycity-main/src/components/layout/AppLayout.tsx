import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  FileText,
  Briefcase,
  User,
  Menu,
  X,
  Wrench,
  Bell,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { contractorProfile } from "@/data/mockData";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { title: "Dashboard", path: "/app/", icon: LayoutDashboard },
  { title: "Jobs", path: "/app/jobs", icon: Search },
  { title: "My Bids", path: "/app/bids", icon: FileText },
  { title: "My Jobs", path: "/app/my-jobs", icon: Briefcase },
  { title: "Profile", path: "/app/profile", icon: User },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const name = localStorage.getItem("name") || "Contractor";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-sidebar fixed h-screen z-30">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-foreground font-bold text-lg leading-tight">FixMyCity</h1>
            <p className="text-muted-foreground text-xs">Contractor Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-3 mt-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary glow-blue"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mx-3 mb-4 glass-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm font-medium truncate">{name}</p>
              <p className="text-muted-foreground text-xs">Contractor</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 glass-sidebar px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-primary" />
          </div>
          <span className="text-foreground font-bold">FixMyCity</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-foreground p-1">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 h-full glass-sidebar p-4 pt-16 space-y-1" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.title}
                </Link>
              );
            })}
          </aside>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass-sidebar border-t border-border flex">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex-1 flex flex-col items-center py-2 gap-1 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0">
        {/* Desktop Top Bar */}
        <div className="hidden md:flex items-center justify-end gap-1 px-8 py-4 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search jobs, bids..."
              className="pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-56 transition-all"
            />
          </div>
          <button className="p-2 rounded-xl transition-all duration-200 hover:bg-accent text-muted-foreground hover:text-foreground relative" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </button>
          <ThemeToggle />
          <div className="flex items-center gap-2 ml-1 pl-2 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {initials}
            </div>
            <span className="hidden lg:block text-sm font-medium text-foreground max-w-[120px] truncate">{name}</span>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-xl transition-all duration-200 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
