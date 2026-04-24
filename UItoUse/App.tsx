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
import IntradayTrading from "./pages/IntradayTrading";
import PennyStorm from "./pages/PennyStorm";
import OptionSignals from "./pages/OptionSignals";
import SystemPositionsPage from "./pages/SystemPositions";
import ComingSoon from "./pages/ComingSoon";
import AdminControlPanel from "./pages/AdminControlPanel";
import Portfolio from "./pages/Portfolio";
import Alerts from "./pages/Alerts";
import News from "./pages/News";
import Backtesting from "./pages/Backtesting";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
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
            <Route path="/intraday-trading" element={<IntradayTrading />} />
            <Route path="/penny-storm" element={<PennyStorm />} />
            <Route path="/option-signals" element={<OptionSignals />} />
            <Route path="/positions" element={<SystemPositionsPage />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/admin" element={<AdminControlPanel />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/news" element={<News />} />
            <Route path="/backtesting" element={<Backtesting />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
