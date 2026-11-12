import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutGrid, LogOut, Search, User, type LucideIcon } from "lucide-react";
import { APPS, appById, getRecents, suggestApps } from "@/apps";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sigil } from "@/components/shared/ornaments";
import { GUEST_ID, useAuth } from "@/lib/auth";
import { Backdrop } from "@/three/lazy";
import { cn } from "@/lib/utils";
import { Spotlight } from "./Spotlight";

function SignInDialog() {
  const { dialogOpen, setDialogOpen, signIn } = useAuth();
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (value: string) => {
    setBusy(true);
    const ok = await signIn(value);
    setBusy(false);
    if (ok) {
      setDialogOpen(false);
      setId("");
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-md border-border bg-popover">
        <DialogHeader>
          <DialogTitle className="text-title text-3xl font-normal">Enter the Hub</DialogTitle>
          <DialogDescription>Your FPL ID loads your public team data. No password is asked for or stored.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(id); }}>
          <div className="space-y-2">
            <Label htmlFor="fpl-id" className="eyebrow">FPL ID</Label>
            <Input id="fpl-id" inputMode="numeric" autoComplete="off" placeholder="e.g. 1234567" value={id} onChange={(e) => setId(e.target.value)} className="num" />
            <p className="text-xs text-muted-foreground">
              On fantasy.premierleague.com open <span className="text-foreground">Points</span>; the ID is the number after{" "}
              <span className="num text-foreground">/entry/</span> in the address bar.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="btn-chrome flex-1" disabled={busy || !id.trim()}>{busy ? "Checking…" : "Sign in"}</Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => void submit(GUEST_ID)}>Try as guest</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserMenu() {
  const { manager, managerId, isGuest, signOut, setDialogOpen } = useAuth();
  if (!managerId) return <Button size="sm" className="btn-chrome" onClick={() => setDialogOpen(true)}>Sign in</Button>;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-40 gap-2 bg-black/40">
          <User />
          <span className="truncate normal-case tracking-normal">{manager?.name ?? "Loading…"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="truncate">{manager ? `${manager.player_first_name} ${manager.player_last_name}` : "Manager"}</p>
          <p className="num text-xs font-normal text-muted-foreground">ID {managerId}{isGuest && " · guest"}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setDialogOpen(true)}>Switch team</DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Spotlight as an overlay, opened from the top bar or with Ctrl/Cmd+K anywhere. */
function SpotlightOverlay({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { managerId } = useAuth();
  const fallback = [...new Set([...getRecents().map((id) => appById(id)!), ...suggestApps({ signedIn: !!managerId, hoursToDeadline: null })])].slice(0, 6);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[12%] max-w-xl translate-y-0 border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Spotlight search</DialogTitle>
          <DialogDescription>Search apps and players</DialogDescription>
        </DialogHeader>
        <Spotlight autoFocus onDone={() => onOpenChange(false)} fallback={fallback} />
      </DialogContent>
    </Dialog>
  );
}

/** macOS-style dock: the launcher, then the apps you used most recently. */
function Dock() {
  const { pathname } = useLocation();
  const { managerId } = useAuth();
  // Re-read on every navigation so the app just opened joins the dock
  const fill = suggestApps({ signedIn: !!managerId, hoursToDeadline: null }).map((a) => a.id);
  const ids = [...new Set([...getRecents(), ...fill])].slice(0, 5);
  const current = APPS.find((a) => a.path === pathname);
  if (current && !ids.includes(current.id)) ids[ids.length - 1] = current.id;

  // A plain Link with a string className: Radix's asChild merge can't handle NavLink's className function
  const item = (to: string, label: string, Icon: LucideIcon) => {
    const isActive = pathname === to;
    return (
      <Tooltip key={to}>
        <TooltipTrigger asChild>
          <Link to={to} aria-label={label} aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-150 hover:-translate-y-1 hover:border-chrome sm:h-12 sm:w-12",
              isActive ? "border-blood bg-blood/25 text-foreground" : "border-border bg-black/50 text-muted-foreground hover:text-foreground",
            )}>
            <Icon className="h-5 w-5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <nav aria-label="Dock" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-3xl border border-white/10 bg-background/80 p-1.5 shadow-2xl backdrop-blur-xl sm:gap-2 sm:p-2">
        {item("/", "All apps", LayoutGrid)}
        <span className="mx-0.5 h-8 w-px bg-border" aria-hidden />
        {ids.map((id) => {
          const app = appById(id)!;
          return item(app.path, app.name, app.icon);
        })}
      </div>
    </nav>
  );
}

export function Layout() {
  const [spotlight, setSpotlight] = useState(false);
  const { pathname } = useLocation();
  const home = pathname === "/";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (home) document.querySelector<HTMLInputElement>('input[role="combobox"]')?.focus();
        else setSpotlight((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [home]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="relative min-h-dvh">
      <Backdrop />
      <div className="fx-overlay" aria-hidden />

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/55 backdrop-blur-xl">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/" className="flex shrink-0 items-center gap-2 text-chrome" aria-label="FPL Insight Hub home">
            <Sigil className="h-7 w-7" />
            {!home && <span className="text-title hidden text-xl uppercase leading-none tracking-[0.18em] sm:block">Insight Hub</span>}
          </Link>
          {!home && (
            <button onClick={() => setSpotlight(true)}
              className="mx-auto flex h-9 w-full max-w-sm items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 text-sm text-muted-foreground transition-colors hover:border-chrome hover:text-foreground">
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate text-left">Search apps and players</span>
              <kbd className="hidden rounded-md border border-white/15 px-1.5 text-[10px] sm:block">Ctrl K</kbd>
            </button>
          )}
          <div className="ml-auto shrink-0"><UserMenu /></div>
        </div>
      </header>

      <main className="container relative z-10 space-y-6 pb-28 pt-6">
        <Outlet />
      </main>

      <Dock />
      <SpotlightOverlay open={spotlight} onOpenChange={setSpotlight} />
      <SignInDialog />
    </div>
  );
}
