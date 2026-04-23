import { PageHeader } from "@/components/layout/PageHeader";
import { Brain, Target, Zap, TrendingUp, Sparkles, Heart } from "lucide-react";

const AboutUs = () => {
  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader
        title="About AV Screener"
        description="The story behind the terminal and our vision for intelligent trading."
      />

      {/* Hero Section */}
      <div className="premium-card relative overflow-hidden p-8 sm:p-12">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-emerald opacity-10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent opacity-5 blur-3xl" />
        
        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-emerald/10 border border-emerald-500/20 text-success text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="h-3 w-3" /> Our Vision
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
            Making stock market analysis <span className="bg-gradient-emerald bg-clip-text text-transparent">smarter, faster, and accessible</span> for everyone.
          </h2>
          <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
            <p>
              AV Screener was built with a simple vision — to make stock market analysis smarter, faster, and more accessible for everyday traders and investors.
            </p>
            <p>
              Created and developed independently by a passionate AI enthusiast and trader, AV Screener combines technology with market insights to help users discover opportunities through intelligent scanners, data-driven signals, and easy-to-use tools.
            </p>
            <p>
              This platform was born from real trading challenges — the need to filter noise, save time, and focus on high-potential stocks with clarity and confidence.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 premium-card p-8 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-emerald shadow-glow-emerald flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Mission Highlight</h3>
              <p className="text-muted-foreground">The core purpose of our existence.</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground leading-tight">
            "Empower traders with <span className="text-accent">smart technology</span> to navigate markets with professional precision."
          </p>
        </div>
        
        <div className="premium-card p-8 bg-gradient-to-br from-sidebar-accent/50 to-transparent flex flex-col items-center justify-center text-center border-accent/20">
            <Heart className="h-10 w-10 text-danger mb-4 animate-pulse" />
            <h4 className="font-bold text-foreground mb-2">Founder Note</h4>
            <p className="text-sm text-muted-foreground italic">
              "Built from passion, curiosity, and the belief that one great idea can create real impact."
            </p>
        </div>
      </div>

      {/* Our Focus Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Our Focus</h3>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "Smart Stock Scanners", icon: Brain, desc: "Algorithmic filtering to find high-conviction setups." },
            { title: "Intraday Opportunities", icon: Zap, desc: "Real-time signals for fast-moving market trends." },
            { title: "Data-Driven Insights", icon: TrendingUp, desc: "Deep analytics derived from market historical data." },
            { title: "User-Friendly Experience", icon: Sparkles, desc: "Clean, intuitive interface designed for efficiency." },
            { title: "Continuous Innovation", icon: Zap, desc: "Always evolving with the latest AI and market tech." }
          ].map((item, i) => (
            <div key={i} className="premium-card p-6 group hover:-translate-y-1 transition-all duration-300">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-gradient-emerald group-hover:text-white transition-colors">
                <item.icon className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-foreground mb-2">{item.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Quote */}
      <div className="text-center py-12">
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">AV Screener &copy; 2026 · Intelligent Trading Terminal</p>
      </div>
    </div>
  );
};

export default AboutUs;
