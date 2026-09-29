import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "@/services/api";
import { toast } from "sonner";
import { Shield } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim() || !confirm.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await API.post("/auth/signup", { name: name.trim(), username, password, role: "ADMIN" });
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Signup failed. Try a different username.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Authority Account</h1>
          <p className="text-muted-foreground text-sm mt-1">Register as a municipal administrator</p>
        </div>

        <form onSubmit={handleSignup} className="glass-card p-8 space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/8 border border-primary/15">
            <Shield className="w-4 h-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Authority / Admin</p>
              <p className="text-xs text-muted-foreground">This account will have admin privileges</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-glow w-full"
              autoComplete="name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</label>
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-glow w-full"
              autoComplete="username"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
            <input
              type="password"
              placeholder="Create a password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-glow w-full"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-glow w-full"
              autoComplete="new-password"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
              ) : "Create Account"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">Sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
