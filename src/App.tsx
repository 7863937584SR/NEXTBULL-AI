import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import News from "./pages/News";
import Economic from "./pages/Economic";
import Research from "./pages/Research";
import Sentimental from "./pages/Sentimental";
import Journaling from "./pages/Journaling";
import Events from "./pages/Events";
import MarketTrace from "./pages/MarketTrace";
import Reports from "./pages/Reports";
import About from "./pages/About";
import Profile from "./pages/Profile";
import ConnectBroker from "./pages/ConnectBroker";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/news" element={<News />} />
              <Route path="/economic" element={<Economic />} />
              <Route path="/research" element={<Research />} />
              <Route path="/sentimental" element={<Sentimental />} />
              <Route path="/journaling" element={<Journaling />} />
              <Route path="/events" element={<Events />} />
              <Route path="/market-trace" element={<MarketTrace />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/about" element={<About />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/connect-broker" element={<ConnectBroker />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
