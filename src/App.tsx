import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const News = lazy(() => import("./pages/News"));
const Economic = lazy(() => import("./pages/Economic"));
const Research = lazy(() => import("./pages/Research"));
const Sentimental = lazy(() => import("./pages/Sentimental"));
const Journaling = lazy(() => import("./pages/Journaling"));
const Events = lazy(() => import("./pages/Events"));
const MarketTrace = lazy(() => import("./pages/MarketTrace"));
const Reports = lazy(() => import("./pages/Reports"));
const About = lazy(() => import("./pages/About"));
const Profile = lazy(() => import("./pages/Profile"));
const ConnectBroker = lazy(() => import("./pages/ConnectBroker"));
const Markets = lazy(() => import("./pages/Markets"));
const Currency = lazy(() => import("./pages/Currency"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Stable QueryClient instance — created outside component to avoid recreation on re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center h-[60vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/markets" element={<Markets />} />
                <Route path="/currency" element={<Currency />} />
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
