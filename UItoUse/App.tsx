import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import StockAnalysis from "./pages/StockAnalysis";
import AIScreener from "./pages/AIScreener";
import Watchlist from "./pages/Watchlist";
import Multibaggers from "./pages/Multibaggers";
import Intraday from "./pages/Intraday";
import PennyStorm from "./pages/PennyStorm";
import SystemPositionsPage from "./pages/SystemPositions";
import ComingSoon from "./pages/ComingSoon";
import AdminControlPanel from "./pages/AdminControlPanel";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analysis" element={<StockAnalysis />} />
            <Route path="/screener" element={<AIScreener />} />
            <Route path="/multibaggers" element={<Multibaggers />} />
            <Route path="/intraday" element={<Intraday />} />
            <Route path="/penny-storm" element={<PennyStorm />} />
            <Route path="/positions" element={<SystemPositionsPage />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/admin" element={<AdminControlPanel />} />
            <Route
              path="/portfolio"
              element={
                <ComingSoon
                  title="Portfolio"
                  description="Holdings, allocation, P&L and AI-powered rebalance suggestions."
                  bullets={["Total value & P&L Today", "Allocation donut chart", "Holdings table", "Sector exposure", "Risk score", "AI rebalance suggestions"]}
                />
              }
            />
            <Route
              path="/alerts"
              element={
                <ComingSoon
                  title="Alerts"
                  description="Create price, RSI, breakout and AI-score alerts."
                  bullets={["Price above/below", "RSI crossing", "Breakout detected", "AI score changed", "Earnings event"]}
                />
              }
            />
            <Route
              path="/news"
              element={
                <ComingSoon
                  title="News & Sentiment"
                  description="Curated news with sentiment analysis across sectors and stocks."
                  bullets={["News cards with source/time", "Positive / Neutral / Negative meter", "Sector sentiment ranking", "Stock sentiment trend"]}
                />
              }
            />
            <Route
              path="/backtesting"
              element={
                <ComingSoon
                  title="Backtesting"
                  description="Test strategies with historical data — CAGR, win rate, drawdown."
                  bullets={["Strategy selector", "Date range & capital", "Risk settings", "Equity curve chart", "Trade log table"]}
                />
              }
            />
            <Route
              path="/reports"
              element={
                <ComingSoon
                  title="Reports"
                  description="Generate downloadable investor-grade reports."
                  bullets={["Daily Market Brief", "Weekly Opportunities", "Portfolio Health Report", "Sector Rotation Report", "AI Recommendation Sheet"]}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <ComingSoon
                  title="Settings"
                  description="Manage your profile, notifications, theme, API keys and subscription."
                  bullets={["Profile", "Theme", "Notifications", "API Keys", "Subscription", "Security"]}
                />
              }
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
