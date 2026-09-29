import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "@/services/api";
import { toast } from "sonner";
import { Wrench } from "lucide-react";

export default function ContractorSignup() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim() || !confirm.trim()) { toast.error("Please fill in all fields."); return; }
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await API.post("/auth/signup", { name: name.trim(), username, password, role: "CONTRACTOR" });
      toast.success("Account created! Please sign in.");
      navigate("/contractor/login");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Signup failed. Try a different username.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-input border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <Wrench className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Join as Contractor</h1>
          <p className="text-muted-foreground text-sm mt-1">Create your contractor account</p>
        </div>
        <form onSubmit={handleSignup} className="glass-card p-8 space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15">
            <Wrench className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Contractor</p>
              <p className="text-xs text-muted-foreground">Bid on jobs and manage your work</p>
            </div>
          </div>
          {[
            { label: "Full Name", val: name, set: setName, ph: "Enter your full name", ac: "name", type: "text" },
            { label: "Username", val: username, set: setUsername, ph: "Choose a username", ac: "username", type: "text" },
            { label: "Password", val: password, set: setPassword, ph: "Create a password (min 6 chars)", ac: "new-password", type: "password" },
            { label: "Confirm Password", val: confirm, set: setConfirm, ph: "Repeat your password", ac: "new-password", type: "password" },
          ].map((f) => (
            <div key={f.label} className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</label>
              <input type={f.type} placeholder={f.ph} value={f.val} onChange={(e) => f.set(e.target.value)}
                className={inputClass} autoComplete={f.ac} />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</> : "Create Account"}
          </button>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/contractor/login" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">Sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
