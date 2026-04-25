import {
  LayoutDashboard, LineChart, Sparkles, Star, Briefcase, Bell,
  Newspaper, History, FileText, Settings, Rocket, Zap, CloudLightning, Award, Shield, Headphones, Flame,
  BookOpen, CreditCard, Terminal, HelpCircle
} from "lucide-react";

export const navGroups = [
  {
    label: "Market Intelligence",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Stock Analysis", url: "/analysis", icon: LineChart },
      { title: "AI Screener", url: "/screener", icon: Sparkles },
      { title: "News & Sentiment", url: "/news", icon: Newspaper },
    ]
  },
  {
    label: "Investing Opportunities",
    items: [
      { title: "Multibaggers", url: "/multibaggers", icon: Rocket },
      { title: "Penny Storm", url: "/penny-storm", icon: CloudLightning },
      { title: "Portfolio", url: "/portfolio", icon: Briefcase },
      { title: "Watchlist", url: "/watchlist", icon: Star },
    ]
  },
  {
    label: "Trading Desk",
    items: [
      { title: "Intraday Trading", url: "/intraday-trading", icon: Flame },
      { title: "Option Signals", url: "/option-signals", icon: Zap },
      { title: "Alerts", url: "/alerts", icon: Bell },
      { title: "Backtesting", url: "/backtesting", icon: History },
    ]
  },
  {
    label: "Reports & Analytics",
    items: [
      { title: "Reports", url: "/reports", icon: FileText },
      { title: "Journal (future)", url: "/journal", icon: BookOpen },
      { title: "Performance", url: "/positions", icon: Award },
    ]
  },
  {
    label: "Account",
    items: [
      { title: "Settings", url: "/settings", icon: Settings },
      { title: "Subscription", url: "/subscription", icon: CreditCard },
      { title: "Support", url: "/contact", icon: Headphones },
    ]
  },
  {
    label: "Admin",
    adminOnly: true,
    items: [
      { title: "Admin Tools", url: "/admin", icon: Shield },
      { title: "Terminal", url: "/terminal", icon: Terminal },
    ]
  }
];

export const secondaryNavItems = [
  { title: "About Us", url: "/about", icon: Sparkles },
  { title: "Contact Us", url: "/contact", icon: Headphones },
];
