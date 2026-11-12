import { Component, lazy, Suspense, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import { ErrorBlock, LoadingBlock } from "@/components/shared/bits";
import { AuthProvider } from "@/lib/auth";
import Dashboard from "@/pages/Dashboard";

const MyTeam = lazy(() => import("@/pages/MyTeam"));
const Players = lazy(() => import("@/pages/Players"));
const Leagues = lazy(() => import("@/pages/Leagues"));
const Insights = lazy(() => import("@/pages/Insights"));
const Status = lazy(() => import("@/pages/Status"));
const About = lazy(() => import("@/pages/About"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return <ErrorBlock message={`Something broke on this page: ${this.state.error.message}`} onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}

const page = (node: ReactNode) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingBlock className="h-96" />}>{node}</Suspense>
  </ErrorBoundary>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={150}>
          <Toaster />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={page(<Dashboard />)} />
                <Route path="/my-team" element={page(<MyTeam />)} />
                <Route path="/players" element={page(<Players />)} />
                <Route path="/leagues" element={page(<Leagues />)} />
                <Route path="/insights" element={page(<Insights />)} />
                <Route path="/status" element={page(<Status />)} />
                <Route path="/about" element={page(<About />)} />
                {/* Routes from the previous version */}
                <Route path="/explore" element={<Navigate to="/players" replace />} />
                <Route path="/league" element={<Navigate to="/leagues" replace />} />
                <Route path="/standings" element={<Navigate to="/leagues" replace />} />
                <Route path="/performance" element={<Navigate to="/my-team" replace />} />
                <Route path="/testing" element={<Navigate to="/status" replace />} />
                <Route path="/privacy" element={<Navigate to="/about" replace />} />
                <Route path="/terms" element={<Navigate to="/about" replace />} />
                <Route path="/credits" element={<Navigate to="/about" replace />} />
                <Route path="*" element={page(<NotFound />)} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
