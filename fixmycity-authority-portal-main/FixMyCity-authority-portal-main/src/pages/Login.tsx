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

      if (role !== "ADMIN") {
        toast.error("Access denied. This portal is for Authority / Admin accounts only.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("userId", userId);
      localStorage.setItem("name", name || username);
      toast.success(`Welcome back, ${name || username}!`);
      navigate("/dashboard");
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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <span className="text-2xl">🏛️</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Authority Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to manage civic operations</p>
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
              className="input-glow w-full"
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
              className="input-glow w-full"
              autoComplete="current-password"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
              <Link to="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </form>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          This portal is restricted to Authority / Admin accounts only.
        </p>
      </div>
    </div>
  );
}
