import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SystemPositionsTable } from "@/components/dashboard/SystemPositionsTable";
import { fetchWatchlist } from "@/services/api";
import { Loader2 } from "lucide-react";

const SystemPositionsPage = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWatchlist();
        setData(res || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="System Positions"
        description="Quantitative strategy engine — Active, Target Hit and SL Hit positions."
      />
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
           <Loader2 className="h-10 w-10 animate-spin text-accent" />
           <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Capturing terminal state...</p>
        </div>
      ) : (
        <SystemPositionsTable data={data} showHeader={false} />
      )}
    </div>
  );
};

export default SystemPositionsPage;
