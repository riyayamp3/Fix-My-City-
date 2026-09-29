import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Search, FileText, Briefcase, User,
  Menu, X, Wrench, Bell, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { title: "Dashboard", path: "/contractor/app/", icon: LayoutDashboard },
  { title: "Jobs", path: "/contractor/app/jobs", icon: Search },
  { title: "My Bids", path: "/contractor/app/bids", icon: FileText },
  { title: "My Jobs", path: "/contractor/app/my-jobs", icon: Briefcase },
  { title: "Profile", path: "/contractor/app/profile", icon: User },
];

export default function ContractorLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const name = localStorage.getItem("name") || "Contractor";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-border fixed h-screen z-30">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-foreground font-bold text-lg leading-tight">FixMyCity</h1>
            <p className="text-muted-foreground text-xs">Contractor Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-3 mt-2 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}
              className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive(item.path)
                  ? "bg-amber-500/10 text-amber-600"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              <item.icon className="w-4 h-4" />
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="p-4 mx-3 mb-4 bg-card border border-border rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-600 font-bold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm font-medium truncate">{name}</p>
              <p className="text-muted-foreground text-xs">Contractor</p>
            </div>
            <button onClick={handleLogout} title="Logout"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-600" />
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
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 h-full bg-sidebar border-r border-border p-4 pt-16 space-y-1" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive(item.path) ? "bg-amber-500/10 text-amber-600" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                <item.icon className="w-4 h-4" />
                {item.title}
              </Link>
            ))}
          </aside>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-xl border-t border-border flex">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}
            className={cn("flex-1 flex flex-col items-center py-2 gap-1 text-[10px] font-medium transition-colors",
              isActive(item.path) ? "text-amber-600" : "text-muted-foreground")}>
            <item.icon className="w-5 h-5" />
            {item.title}
          </Link>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0">
        {/* Desktop Top Bar */}
        <div className="hidden md:flex items-center justify-end gap-2 px-8 py-3 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-20">
          <button className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground relative transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </button>
          <ThemeToggle />
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-600 font-bold text-sm">
              {initials}
            </div>
            <span className="hidden lg:block text-sm font-medium text-foreground max-w-[120px] truncate">{name}</span>
          </div>
          <button onClick={handleLogout} title="Logout"
            className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
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
