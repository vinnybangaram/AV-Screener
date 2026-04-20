import { Activity, Shield, TrendingUp, Users, UserCheck, Clock, Loader2 } from "lucide-react";
import { useIsAdmin, setIsAdmin } from "@/lib/admin-store";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { fetchAdminAnalytics } from "@/services/api";
import { cn } from "@/lib/utils";

const AdminControlPanel = () => {
  const isAdmin = useIsAdmin();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchAdminAnalytics();
        setData(res);
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    if (isAdmin) loadData();
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-muted-foreground font-medium">Securing administrative transmission...</p>
      </div>
    );
  }

  const kpis = [
    { label: "Total Users", value: data?.total_users || "0", icon: Users, accent: "text-accent" },
    { label: "DAU (24H)", value: data?.dau || "0", icon: Activity, accent: "text-warning" },
    { label: "MAU (30D)", value: data?.mau || "0", icon: TrendingUp, accent: "text-success" },
    { label: "Paid Users", value: data?.paid_users || "0", icon: Shield, accent: "text-foreground" },
  ];

  const usersList = data?.recent_logins || [];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-accent" />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">Administration</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Admin Control Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real-time system-wide analytics and user population monitoring.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsAdmin(false)}>Exit admin mode</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="kpi-card group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                <k.icon className="h-5 w-5 text-accent" />
              </div>
              <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent uppercase">
                Live
              </span>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{k.label}</div>
            <div className="mt-1 text-4xl font-bold tabular-nums">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="premium-card overflow-hidden">
        <div className="p-5 pb-3 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-accent" />
          <h3 className="font-semibold">Recent User Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left font-semibold px-5 py-2.5">User</th>
                <th className="text-center font-semibold py-2.5">Role</th>
                <th className="text-center font-semibold py-2.5">Plan</th>
                <th className="text-center font-semibold py-2.5">Status</th>
                <th className="text-right font-semibold pr-5 py-2.5">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u: any) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-bold tracking-tight">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded border bg-accent/10 text-accent text-xs">U</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={cn(
                      "rounded border px-2 py-0.5 text-[10px] font-bold uppercase",
                      u.plan !== 'free' ? "bg-accent/10 text-accent border-accent/20" : "bg-muted text-muted-foreground"
                    )}>{u.plan}</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase">
                      <div className="h-1 w-1 rounded-full bg-success animate-pulse" /> Active
                    </span>
                  </td>
                  <td className="pr-5 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                  </td>
                </tr>
              ))}
              {usersList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground italic">No users found in colony memory.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminControlPanel;
