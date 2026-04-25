import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
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
import SystemPositionsPage from "./pages/SystemPositions";
import OptionSignals from "./pages/OptionSignals";
import Portfolio from "./pages/Portfolio";
import Alerts from "./pages/Alerts";
import News from "./pages/News";
import Backtesting from "./pages/Backtesting";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ComingSoon from "./pages/ComingSoon";
import AdminControlPanel from "./pages/AdminControlPanel";
import Login from "./pages/Login";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import MasterDataAdmin from "./pages/MasterDataAdmin";
import NotFound from "./pages/NotFound";
import UpstoxDashboard from "./pages/UpstoxDashboard";
import UpstoxCallback from "./pages/UpstoxCallback";
import ProtectedRoute from "./components/common/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Analysis & Screener */}
            <Route path="/analysis" element={<StockAnalysis />} />
            <Route path="/analyse-stock" element={<Navigate to="/analysis" replace />} />
            
            <Route path="/screener" element={<AIScreener />} />
            
            {/* Strategies */}
            <Route path="/multibaggers" element={<Multibaggers />} />
            <Route path="/multibagger" element={<Navigate to="/multibaggers" replace />} />
            
            <Route path="/intraday" element={<Intraday />} />
            <Route path="/intraday-trading" element={<IntradayTrading />} />
            
            <Route path="/penny-storm" element={<PennyStorm />} />
            <Route path="/penny-storm-old" element={<Navigate to="/penny-storm" replace />} />
            
            {/* Portfolio & Watchlist */}
            <Route path="/positions" element={<SystemPositionsPage />} />
            <Route path="/option-signals" element={<OptionSignals />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/upstox" element={<UpstoxDashboard />} />
            <Route path="/upstox/callback" element={<UpstoxCallback />} />
            
            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminControlPanel /></ProtectedRoute>} />
            <Route path="/admin/master-data" element={<ProtectedRoute requiredRole="admin"><MasterDataAdmin /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<Navigate to="/admin" replace />} />

            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/news" element={<News />} />
            <Route path="/backtesting" element={<Backtesting />} />
             <Route path="/reports" element={<Reports />} />
             <Route path="/settings" element={<Settings />} />
             <Route path="/about" element={<AboutUs />} />
             <Route path="/contact" element={<ContactUs />} />
           </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
