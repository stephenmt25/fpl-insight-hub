import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import Performance from "./pages/Performance";
import Insights from "./pages/Insights";
import LeagueStandings from "./pages/LeagueStandings";
import { TabProvider } from './context/standings-tabs-context.tsx';
import { AuthProvider } from "./context/auth-context";
import { LiveGWProvider } from "./context/livegw-context.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LiveGWProvider>
        <TabProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/performance" element={<Performance />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/standings" element={<LeagueStandings />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </TabProvider>
      </LiveGWProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;