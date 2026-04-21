import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthUser, signIn } from "@/lib/auth-store";
import { User, Bell, Palette, KeyRound, CreditCard, ShieldCheck, Copy, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const user = useAuthUser();
  const [name, setName] = useState(user?.name || "Arjun Verma");
  const [email, setEmail] = useState(user?.email || "arjun@avscreener.io");
  const [phone, setPhone] = useState("+91 98765 43210");

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [density, setDensity] = useState<"comfy" | "compact">("comfy");

  const [keys, setKeys] = useState([
    { id: "k1", label: "Production", key: "av_live_sk_••••••••a8f2", created: "12 Mar 2025" },
    { id: "k2", label: "Staging", key: "av_test_sk_••••••••3d91", created: "02 Feb 2025" },
  ]);

  const saveProfile = () => {
    const updatedUser = { ...user, name, email };
    signIn(updatedUser, localStorage.getItem("token") || "");
    toast.success("Profile updated");
  };

  const newKey = () => {
    const id = `k${Date.now()}`;
    setKeys([{ id, label: "New Key", key: `av_live_sk_••••••••${Math.random().toString(36).slice(-4)}`, created: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) }, ...keys]);
    toast.success("API key generated");
  };
  const removeKey = (id: string) => { setKeys(keys.filter((k) => k.id !== id)); toast.success("Key revoked"); };
  const copyKey = (k: string) => { navigator.clipboard.writeText(k); toast.success("Copied to clipboard"); };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <PageHeader title="Settings" description="Manage your profile, notifications, theme, API keys and subscription." />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-card border h-11 p-1 shadow-card text-[10px] md:text-sm">
          <TabsTrigger value="profile" className="gap-1.5"><User className="h-3.5 w-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" />Notifications</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5"><Palette className="h-3.5 w-3.5" />Appearance</TabsTrigger>
          <TabsTrigger value="api" className="gap-1.5"><KeyRound className="h-3.5 w-3.5" />API Keys</TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" />Subscription</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-5">
          <Card className="p-6 bg-gradient-card shadow-card">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gradient-emerald text-white font-bold">{user?.initials || "AV"}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold">{name}</h3>
                <p className="text-xs text-muted-foreground">{email}</p>
                <Badge variant="secondary" className="text-[10px] mt-1">{user?.plan || "Pro Trial"}</Badge>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="text-xs">Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Default Currency</Label><Input value="INR (₹)" disabled className="mt-1" /></div>
            </div>
            <div className="flex justify-end mt-6 gap-2">
              <Button variant="outline">Cancel</Button>
              <Button onClick={saveProfile} className="gap-1.5 bg-gradient-emerald text-white border-0 shadow-glow-emerald"><Check className="h-4 w-4" /> Save Changes</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-5">
          <Card className="p-6 bg-gradient-card shadow-card space-y-4">
            {[
              { label: "Email alerts", desc: "Trade signals, breakouts and AI score changes", state: emailAlerts, set: setEmailAlerts },
              { label: "Push notifications", desc: "Real-time browser & mobile push", state: pushAlerts, set: setPushAlerts },
              { label: "SMS alerts", desc: "Critical alerts via SMS (charges may apply)", state: smsAlerts, set: setSmsAlerts },
              { label: "Weekly digest", desc: "Summary of opportunities every Friday", state: weeklyDigest, set: setWeeklyDigest },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <div className="font-semibold text-sm">{row.label}</div>
                  <div className="text-xs text-muted-foreground">{row.desc}</div>
                </div>
                <Switch checked={row.state} onCheckedChange={row.set} />
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-5">
          <Card className="p-6 bg-gradient-card shadow-card space-y-6">
            <div>
              <Label className="text-xs uppercase tracking-wider">Theme</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button key={t} onClick={() => { setTheme(t); toast.success(`Theme: ${t}`); }} className={`p-4 rounded-lg border text-sm font-semibold capitalize transition ${theme === t ? "border-accent bg-accent/10 text-accent shadow-glow-accent" : "bg-card hover:bg-muted"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-xs uppercase tracking-wider">Density</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {(["comfy", "compact"] as const).map((d) => (
                  <button key={d} onClick={() => setDensity(d)} className={`p-4 rounded-lg border text-sm font-semibold capitalize transition ${density === d ? "border-accent bg-accent/10 text-accent" : "bg-card hover:bg-muted"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-5">
          <Card className="p-6 bg-gradient-card shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold">API Keys</h3>
                <p className="text-xs text-muted-foreground">Programmatic access to AV Screener data and signals.</p>
              </div>
              <Button onClick={newKey} className="gap-1.5 bg-gradient-emerald text-white border-0"><Plus className="h-4 w-4" /> New Key</Button>
            </div>
            <div className="space-y-2">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"><KeyRound className="h-4 w-4 text-accent" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="font-semibold text-sm">{k.label}</span><Badge variant="outline" className="text-[10px]">{k.created}</Badge></div>
                    <code className="text-[11px] text-muted-foreground font-mono">{k.key}</code>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyKey(k.key)}><Copy className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => removeKey(k.id)}><Trash2 className="h-4 w-4 text-danger" /></Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Starter", price: "Free", features: ["10 watchlist symbols", "Daily market brief", "Basic screener"], cta: "Current" },
              { name: "Pro", price: "₹1,499/mo", features: ["Unlimited watchlist", "All AI signals", "Backtesting", "API access"], cta: "Upgrade", highlight: true },
              { name: "Enterprise", price: "Custom", features: ["Team seats", "Custom strategies", "Dedicated support", "SLA"], cta: "Contact Sales" },
            ].map((p) => (
              <Card key={p.name} className={`p-6 bg-gradient-card shadow-card ${p.highlight ? "ring-2 ring-accent shadow-glow-emerald" : ""}`}>
                {p.highlight && <Badge className="bg-gradient-emerald text-white border-0 mb-2">Most Popular</Badge>}
                <h3 className="font-bold text-lg">{p.name}</h3>
                <div className="text-2xl font-extrabold mt-1">{p.price}</div>
                <ul className="mt-4 space-y-2 text-xs">
                  {p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> {f}</li>)}
                </ul>
                <Button className={`w-full mt-5 ${p.highlight ? "bg-gradient-emerald text-white border-0 shadow-glow-emerald" : ""}`} variant={p.highlight ? "default" : "outline"} onClick={() => toast.info(`${p.cta} clicked`)}>{p.cta}</Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-5">
          <Card className="p-6 bg-gradient-card shadow-card space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div>
                <div className="font-semibold text-sm">Two-factor authentication</div>
                <div className="text-xs text-muted-foreground">Add an extra layer of security to your account.</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info("2FA setup wizard")}>Enable</Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div>
                <div className="font-semibold text-sm">Active sessions</div>
                <div className="text-xs text-muted-foreground">2 devices · last login from Mumbai 12 min ago</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.success("All other sessions signed out")}>Sign out others</Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-danger/5 border-danger/30">
              <div>
                <div className="font-semibold text-sm text-danger">Delete account</div>
                <div className="text-xs text-muted-foreground">Permanently remove your account and data.</div>
              </div>
              <Button variant="destructive" size="sm" onClick={() => toast.error("Are you sure? Contact support to confirm.")}>Delete</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
