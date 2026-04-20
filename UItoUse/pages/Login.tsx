import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signIn, useAuthUser } from "@/lib/auth-store";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    signIn(email);
    toast.success("Welcome back to AV Screener");
    setLoading(false);
    navigate("/", { replace: true });
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

            <div className="relative my-4 text-center">
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
              <span className="relative inline-block bg-background px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                or continue with
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="h-11 gap-2" onClick={() => toast.info("Google SSO coming soon")}>
                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 5.5 29.3 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 5.5 29.3 3.5 24 3.5 16.4 3.5 9.7 7.8 6.3 14.7z"/><path fill="#4CAF50" d="M24 44.5c5.2 0 10-2 13.5-5.3l-6.2-5.2C29.5 35.5 26.9 36.5 24 36.5c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.6 40.1 16.3 44.5 24 44.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.2 5.2c-.4.4 6.8-5 6.8-15 0-1.2-.1-2.3-.4-3.4z"/></svg>
                Google
              </Button>
              <Button type="button" variant="outline" className="h-11 gap-2" onClick={() => toast.info("Apple SSO coming soon")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 1.43c0 1.14-.466 2.275-1.227 3.078-.821.857-2.155 1.516-3.273 1.42-.131-1.085.42-2.226 1.158-2.954.819-.81 2.215-1.42 3.342-1.544zM21.2 17.06c-.55 1.27-.81 1.83-1.518 2.95-.99 1.55-2.385 3.48-4.115 3.5-1.535.02-1.93-1-4.014-.99-2.085.01-2.52 1.01-4.057.99-1.73-.02-3.05-1.78-4.04-3.32C.96 15.85.7 10.04 3.43 7.04c1.18-1.31 3.04-2.13 4.83-2.13 1.84 0 3 .98 4.52.98 1.47 0 2.36-.99 4.5-.99 1.6 0 3.28.86 4.49 2.36-3.95 2.16-3.32 7.81-.57 9.8z"/></svg>
                Apple
              </Button>
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
