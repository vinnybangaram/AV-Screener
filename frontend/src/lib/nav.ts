import {
  LayoutDashboard, LineChart, Sparkles, Star, Briefcase, Bell,
  Newspaper, History, FileText, Settings, Rocket, Zap, CloudLightning, Award, Shield
} from "lucide-react";

export const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, adminOnly: false },
  { title: "Stock Analysis", url: "/analysis", icon: LineChart, adminOnly: false },
  { title: "AI Screener", url: "/screener", icon: Sparkles, adminOnly: false },
  { title: "Multibaggers", url: "/multibaggers", icon: Rocket, adminOnly: false },
  { title: "Intraday", url: "/intraday", icon: Zap, adminOnly: false },
  { title: "Penny Storm", url: "/penny-storm", icon: CloudLightning, adminOnly: false },
  { title: "Option Signals", url: "/option-signals", icon: Zap, adminOnly: false },
  { title: "System Positions", url: "/positions", icon: Award, adminOnly: false },
  { title: "Watchlist", url: "/watchlist", icon: Star, adminOnly: false },
  { title: "Portfolio", url: "/portfolio", icon: Briefcase, adminOnly: false },
  { title: "Alerts", url: "/alerts", icon: Bell, adminOnly: false },
  { title: "News & Sentiment", url: "/news", icon: Newspaper, adminOnly: false },
  { title: "Backtesting", url: "/backtesting", icon: History, adminOnly: false },
  { title: "Reports", url: "/reports", icon: FileText, adminOnly: false },
  { title: "Settings", url: "/settings", icon: Settings, adminOnly: false },
  { title: "Admin Tools", url: "/admin", icon: Shield, adminOnly: true },
];
