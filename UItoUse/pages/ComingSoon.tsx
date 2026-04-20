import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Construction, Sparkles } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  bullets?: string[];
}

const ComingSoon = ({ title, description, bullets = [] }: ComingSoonProps) => (
  <div className="max-w-[1600px] mx-auto">
    <PageHeader title={title} description={description} />
    <div className="rounded-xl border-2 border-dashed bg-card/50 p-12 flex flex-col items-center text-center">
      <div className="h-14 w-14 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-glow mb-4">
        <Construction className="h-7 w-7 text-accent-foreground" />
      </div>
      <h3 className="text-lg font-bold tracking-tight">Coming Soon</h3>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
        This module is being built. The structure and design tokens are in place — wire it up next.
      </p>
      {bullets.length > 0 && (
        <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-lg w-full">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
              <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
              <span className="text-foreground/80">{b}</span>
            </li>
          ))}
        </ul>
      )}
      <Button size="sm" className="mt-6 bg-gradient-emerald hover:opacity-90 text-white shadow-glow-emerald border-0">Notify me</Button>
    </div>
  </div>
);

export default ComingSoon;
