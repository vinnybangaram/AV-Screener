import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signIn, useAuthUser } from "@/lib/auth-store";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import { manualLogin, googleLogin } from "@/services/api";

const Login = () => {
  const navigate = useNavigate();
  const user = useAuthUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // If already signed in, bounce to dashboard
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  if (user) return <Navigate to="/" replace />;

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = "Email is required";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await manualLogin(email, password);
      if (data.success) {
        signIn(data.user, data.token);
        toast.success(`Welcome back, ${data.user.name}`);
        navigate("/", { replace: true });
      } else {
        toast.error(data.error || "Authentication failed");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Authentication error encountered.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const data = await googleLogin(credentialResponse.credential);
      if (data.success) {
        signIn(data.user, data.token);
        toast.success(`Welcome back, ${data.user.name}`);
        navigate("/", { replace: true });
      } else {
        toast.error(data.error || "Google login failed");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* LEFT — Brand panel */}
      <aside className="relative overflow-hidden hidden lg:flex flex-col justify-between p-10 text-white"
        style={{ background: "linear-gradient(160deg, hsl(200 60% 6%) 0%, hsl(180 55% 9%) 45%, hsl(158 70% 16%) 100%)" }}
      >
        {/* Decorative orbs */}
        <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-success/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "linear-gradient(hsl(0 0% 100% / 0.7) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.7) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />

        <header className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-emerald shadow-glow-emerald">
            <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold tracking-tight">AV Screener</div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/60 font-medium">AI Market Intel</div>
          </div>
        </header>

        <div className="relative max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Institutional-grade intelligence
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight">
            Trade smarter with{" "}
            <span className="bg-gradient-emerald bg-clip-text text-transparent">AI conviction</span>.
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            Real-time multi-bagger discovery, intraday radar, and quantitative alpha — all in one premium terminal trusted by 12,000+ investors.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { v: "92%", l: "Signal precision" },
              { v: "<200ms", l: "Sync latency" },
              { v: "12k+", l: "Active members" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-3">
                <div className="font-mono text-xl font-bold tabular-nums bg-gradient-emerald bg-clip-text text-transparent">{s.v}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/60 font-semibold mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <footer className="relative flex items-center justify-between text-[11px] text-white/55">
          <span>© {new Date().getFullYear()} AV Screener · All rights reserved</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            <span>SOC 2 · ISO 27001</span>
          </div>
        </footer>
      </aside>

      {/* RIGHT — Auth form */}
      <main className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-7">
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-emerald shadow-glow-emerald">
              <TrendingUp className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold tracking-tight">AV Screener</span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent mb-3">
              <Zap className="h-3 w-3" /> Sign in
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your credentials to access your AI trading terminal.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@firm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-9 h-11 ${errors.email ? "border-danger focus-visible:ring-danger/30" : ""}`}
                />
              </div>
              {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider">Password</Label>
                <button type="button" className="text-[11px] font-semibold text-accent hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-9 pr-10 h-11 ${errors.password ? "border-danger focus-visible:ring-danger/30" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                <span className="text-muted-foreground">Remember me for 30 days</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-emerald hover:opacity-90 text-white border-0 shadow-glow-emerald font-bold gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> Sign in to terminal
                </>
              )}
            </Button>

            <div className="flex justify-center">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error("Google Login Failed.")}
                    theme="outline"
                    shape="pill"
                    size="large"
                    width="400"
                />
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button onClick={() => signIn("demo@avscreener.io")} className="font-semibold text-accent hover:underline">
              Continue as Demo →
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
