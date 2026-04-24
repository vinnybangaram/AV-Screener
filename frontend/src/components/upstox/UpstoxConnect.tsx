import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchUpstoxLoginUrl, fetchUpstoxProfile, disconnectUpstox } from "@/services/api";
import { toast } from "sonner";
import { ShieldCheck, ArrowRightLeft, Link2, Unlink, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function UpstoxConnect() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetchUpstoxProfile();
      setProfile(res);
    } catch (err) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetchUpstoxLoginUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      toast.error("Failed to generate login URL");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect your Upstox account?")) return;
    try {
      await disconnectUpstox();
      setProfile(null);
      toast.success("Disconnected from Upstox");
    } catch (err) {
      toast.error("Failed to disconnect");
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  return (
    <Card className="premium-card p-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <ArrowRightLeft className="h-24 w-24" />
      </div>
      
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <img src="https://upstox.com/apple-touch-icon.png" className="h-6 w-6 rounded" alt="Upstox" />
            Upstox Terminal
          </h3>
          <p className="text-sm text-muted-foreground">Link your account to enable live trading and real-time execution.</p>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
          profile ? "bg-success/20 text-success border border-success/30" : "bg-muted text-muted-foreground"
        )}>
          {profile ? "Connected" : "Disconnected"}
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-bold">Secure Access</p>
              <p className="text-xs text-muted-foreground">Bank-grade encryption for all API interactions.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-bold">Live Execution</p>
              <p className="text-xs text-muted-foreground">Zero-latency order placement via web sockets.</p>
            </div>
          </div>
        </div>

        <div className="bg-card/50 border rounded-2xl p-5 flex flex-col justify-center items-center text-center">
          {profile ? (
            <>
              <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center mb-3">
                <User className="h-6 w-6 text-accent" />
              </div>
              <p className="font-bold">{profile.user_name}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Client ID: {profile.client_id}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-4 text-danger hover:text-danger hover:bg-danger/10 gap-2"
                onClick={handleDisconnect}
              >
                <Unlink className="h-3.5 w-3.5" /> Disconnect Broker
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">No broker account linked to your profile.</p>
              <Button 
                className="w-full bg-accent hover:opacity-90 text-white border-0 shadow-glow-accent gap-2"
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Connect Upstox
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
