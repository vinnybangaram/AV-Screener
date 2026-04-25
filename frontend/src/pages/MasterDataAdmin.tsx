import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, Search, CheckCircle2, AlertCircle, Clock, 
  BarChart3, FileText, TrendingUp, Activity, ShieldCheck, Download
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const MasterDataAdmin = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('av_token');
      const res = await axios.get('http://localhost:10000/api/admin/master-data/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setData(res.data);
    } catch (error) {
      toast.error("Security: Admin access required");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('av_token');
      await axios.post('http://localhost:10000/api/admin/master-data/sync', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Enterprise Sync Task Initiated");
    } catch (e) { toast.error("Sync Permission Denied"); }
    finally { setSyncing(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center animate-pulse text-accent">Establishing Secure Connection...</div>;

  return (
    <div className="space-y-6 p-8 max-w-[1600px] mx-auto bg-background/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic">Master Data <span className="text-accent">Engine</span></h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Enterprise Instrument Controller • Indian Markets (NSE)</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hidden md:flex gap-2">
            <Download className="w-4 h-4" /> Export Report
          </Button>
          <Button onClick={handleSync} disabled={syncing} className="bg-accent hover:bg-accent/90 text-white shadow-glow-accent px-6">
            <RefreshCw className={syncing ? 'animate-spin w-4 h-4' : 'w-4 h-4'} />
            {syncing ? 'Ingesting...' : 'Trigger Sync'}
          </Button>
        </div>
      </div>

      {/* Stats Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatWidget label="TOTAL UNIVERSE" value={data?.stats?.total} sub="Active + Deactivated" icon={<Database />} color="blue" />
        <StatWidget label="EQUITIES" value={data?.stats?.equities} sub="NSE Mainboard" icon={<TrendingUp />} color="emerald" />
        <StatWidget label="ETFs & SME" value={(data?.stats?.etfs || 0) + (data?.stats?.smes || 0)} sub="Segment Breakdown" icon={<Activity />} color="purple" />
        <StatWidget label="SYSTEM STATUS" value="HEALTHY" sub={`Last Sync: ${new Date(data?.stats?.last_sync).toLocaleTimeString()}`} icon={<CheckCircle2 />} color="amber" />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="xl:col-span-2 premium-card p-6 min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-lg">Ingestion Performance</h3>
              <p className="text-xs text-muted-foreground font-medium">Processing duration trend (ms)</p>
            </div>
            <Badge className="bg-accent/10 text-accent border-accent/20">LIVE METRICS</Badge>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.history || []}>
                <defs>
                  <linearGradient id="colorDur" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--accent)' }}
                />
                <Area type="monotone" dataKey="avg_duration" stroke="var(--accent)" fillOpacity={1} fill="url(#colorDur)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Operational Guardrails */}
        <Card className="premium-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" /> Security Overview
            </h3>
            <div className="space-y-4">
              <GuardrailItem label="Rate Limiting" value="100 req / 15m" status="ENABLED" />
              <GuardrailItem label="Stale Detection" value="7 Days TTL" status="ACTIVE" />
              <GuardrailItem label="Snapshot Buffer" value="Last 10 Days" status="HEALTHY" />
              <GuardrailItem label="NSE Ingestion" value="Retry Enabled" status="ONLINE" />
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-widest font-bold">
              Engine Version: v2.4.0-Enterprise <br/>
              Authorization: JWT / ADMIN_GATE
            </p>
          </div>
        </Card>
      </div>

      {/* Raw Health Data */}
      <Card className="premium-card overflow-hidden">
        <div className="p-4 bg-muted/20 border-b flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold">Historical Records Processed</h3>
        </div>
        <div className="p-6">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.history || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip />
                <Line type="stepAfter" dataKey="total_records" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
};

const StatWidget = ({ label, value, sub, icon, color }) => (
  <Card className="p-6 premium-card border-l-4" style={{ borderLeftColor: `var(--${color}-500)` }}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 rounded-md bg-${color}-500/10 text-${color}-500`}>
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
      </div>
      <Badge variant="outline" className="text-[10px] tracking-tighter opacity-50 uppercase">{label}</Badge>
    </div>
    <h4 className="text-3xl font-black mb-1">{value?.toLocaleString() || '0'}</h4>
    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{sub}</p>
  </Card>
);

const GuardrailItem = ({ label, value, status }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
    <div>
      <p className="text-xs font-bold text-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground">{value}</p>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow-emerald animate-pulse" />
      <span className="text-[10px] font-black text-emerald-500 italic tracking-tighter">{status}</span>
    </div>
  </div>
);

export default MasterDataAdmin;
