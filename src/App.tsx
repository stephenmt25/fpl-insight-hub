import { Component, Suspense, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { APPS, CATEGORIES, REDIRECTS, pushRecent, type AppDef } from "@/apps";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import { ErrorBlock, LoadingBlock } from "@/components/shared/bits";
import { AuthProvider, GUEST_ID, useAuth } from "@/lib/auth";
import { useFpl } from "@/lib/fpl/hooks";
import Launcher from "@/pages/Launcher";
import NotFound from "@/pages/NotFound";
import { BallScene } from "@/three/lazy";

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
      return <ErrorBlock message={`Something broke in this app: ${this.state.error.message}`} onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}

function SignInGate({ app }: { app: AppDef }) {
  const { setDialogOpen, signIn } = useAuth();
  return (
    <div className="panel mx-auto flex max-w-lg flex-col items-center gap-4 p-8 text-center">
      <BallScene />
      <h2 className="chrome-text text-3xl">{app.name} needs your team</h2>
      <p className="text-sm text-muted-foreground">Enter your FPL ID to open this app. Only public data is read; there is no password.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button className="btn-chrome" onClick={() => setDialogOpen(true)}>Sign in with FPL ID</Button>
        <Button variant="outline" onClick={() => void signIn(GUEST_ID)}>Try as guest</Button>
      </div>
    </div>
  );
}

/** Chrome around every app: title bar, sign-in gate, shared data loading and error handling. */
function AppFrame({ app }: { app: AppDef }) {
  const { fpl, isLoading, error, refetch } = useFpl();
  const { managerId, manager } = useAuth();
  const category = CATEGORIES.find((c) => c.id === app.category)!;
  useEffect(() => pushRecent(app.id), [app.id]);

  return (
    <>
      <header className="flex animate-rise items-center gap-4 [text-shadow:0_1px_3px_#000]">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center border border-chrome/50 bg-gradient-to-b from-zinc-100 to-zinc-500 text-black shadow-[0_0_30px_-8px_hsl(var(--blood))]">
          <app.icon className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">
            <Link to="/" className="inline-flex items-center hover:text-foreground"><ChevronLeft className="h-3 w-3" />Apps</Link>
            {" / "}{category.name}{app.needsManager && manager ? ` / ${manager.name}` : ""}
          </p>
          <h1 className="chrome-text truncate text-3xl leading-tight sm:text-4xl">{app.name}</h1>
          <p className="truncate text-sm text-muted-foreground">{app.tagline}</p>
        </div>
      </header>
      <ErrorBoundary key={app.id}>
        {app.needsManager && !managerId ? <SignInGate app={app} />
          : isLoading ? <LoadingBlock className="h-96" />
          : error || !fpl ? <ErrorBlock onRetry={() => void refetch()} />
          : (
            <Suspense fallback={<LoadingBlock className="h-96" />}>
              <app.component fpl={fpl} managerId={managerId ?? ""} />
            </Suspense>
          )}
      </ErrorBoundary>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={150}>
          <Toaster />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<ErrorBoundary><Launcher /></ErrorBoundary>} />
                {APPS.map((app) => <Route key={app.id} path={app.path} element={<AppFrame app={app} />} />)}
                {Object.entries(REDIRECTS).map(([from, to]) => <Route key={from} path={from} element={<Navigate to={to} replace />} />)}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
