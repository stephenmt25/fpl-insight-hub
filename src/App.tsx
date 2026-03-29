import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import Performance from "./pages/Performance";
import Insights from "./pages/Insights";
import LeagueStandings from "./pages/LeagueStandings";
import DataSyncTesting from "./pages/DataSyncTesting";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Credits from "./pages/Credits";
import NotFound from "./pages/NotFound";
import MyTeam from "./pages/MyTeam";
import PlayerExplorer from "./pages/PlayerExplorer";
import { AuthProvider } from "./context/auth-context";
import { LiveGWProvider } from "./context/livegw-context.tsx";
import { TeamsProvider } from "./context/teams-context.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TeamsProvider>
      <AuthProvider>
        <LiveGWProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ErrorBoundary>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
                    <Route path="/my-team" element={<ErrorBoundary><MyTeam /></ErrorBoundary>} />
                    <Route path="/explore" element={<ErrorBoundary><PlayerExplorer /></ErrorBoundary>} />
                    <Route path="/league" element={<ErrorBoundary><LeagueStandings /></ErrorBoundary>} />
                    <Route path="/insights" element={<ErrorBoundary><Insights /></ErrorBoundary>} />
                    <Route path="/testing" element={<ErrorBoundary><DataSyncTesting /></ErrorBoundary>} />
                    {/* Legacy redirects */}
                    <Route path="/standings" element={<Navigate to="/league" replace />} />
                    <Route path="/performance" element={<ErrorBoundary><Performance /></ErrorBoundary>} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/credits" element={<Credits />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </LiveGWProvider>
      </AuthProvider>
    </TeamsProvider>
  </QueryClientProvider>
);

export default App;
