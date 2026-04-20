import { PageHeader } from "@/components/layout/PageHeader";
import { SystemPositionsTable } from "@/components/dashboard/SystemPositionsTable";

const SystemPositionsPage = () => {
  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="System Positions"
        description="Quantitative strategy engine — Active, Target Hit and SL Hit positions."
      />
      <SystemPositionsTable showHeader={false} />
    </div>
  );
};

export default SystemPositionsPage;
