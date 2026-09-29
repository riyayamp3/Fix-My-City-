import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "@/services/api";
import { toast } from "sonner";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { username, password });
      const { token, role, userId, name } = res.data;

      if (role !== "CONTRACTOR") {
        toast.error("Access denied. This portal is for Contractor accounts only.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("userId", userId);
      localStorage.setItem("name", name || username);
      toast.success(`Welcome back, ${name || username}!`);
      navigate("/app/");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Login failed. Check your credentials.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <span className="text-2xl">🔧</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Contractor Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to discover and bid on jobs</p>
        </div>

        <form onSubmit={handleLogin} className="glass-card p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10"
              autoComplete="username"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10"
              autoComplete="current-password"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </div>

          <div className="text-center pt-1">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </form>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          This portal is restricted to Contractor accounts only.
        </p>
      </div>
    </div>
  );
}
