import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Brain, Home, LogOut, Search, Shield, Trophy, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sigil } from "@/components/shared/ornaments";
import { GUEST_ID, useAuth } from "@/lib/auth";
import { Backdrop } from "@/three/lazy";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/my-team", label: "My Team", icon: Shield },
  { to: "/players", label: "Players", icon: Search },
  { to: "/leagues", label: "Leagues", icon: Trophy },
  { to: "/insights", label: "Insights", icon: Brain },
];

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
          <DialogTitle className="h-gothic chrome-text text-3xl">Enter the Hub</DialogTitle>
          <DialogDescription>
            Your FPL ID loads your public team data. No password is asked for or stored.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(id);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="fpl-id" className="eyebrow">FPL ID</Label>
            <Input id="fpl-id" inputMode="numeric" autoComplete="off" placeholder="e.g. 1234567" value={id} onChange={(e) => setId(e.target.value)} className="num" />
            <p className="text-xs text-muted-foreground">
              On fantasy.premierleague.com open <span className="text-foreground">Points</span>; the ID is the number after{" "}
              <span className="num text-foreground">/entry/</span> in the address bar.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="btn-chrome flex-1" disabled={busy || !id.trim()}>
              {busy ? "Checking…" : "Sign in"}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => void submit(GUEST_ID)}>
              Try as guest
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserMenu() {
  const { manager, managerId, isGuest, signOut, setDialogOpen } = useAuth();
  if (!managerId) {
    return (
      <Button size="sm" className="btn-chrome" onClick={() => setDialogOpen(true)}>
        Sign in
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-44 gap-2">
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
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout() {
  return (
    <div className="relative min-h-dvh">
      <Backdrop />
      <div className="fx-overlay" aria-hidden />

      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-chrome" aria-label="FPL Insight Hub home">
            <Sigil className="h-7 w-7" />
            <span className="chrome-sheen font-fraktur text-2xl leading-none">Insight Hub</span>
          </Link>
          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "border-b-2 px-3 py-4 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors",
                    isActive ? "border-blood text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container relative z-10 space-y-6 pb-28 pt-6 md:pb-12">
        <Outlet />
      </main>

      <footer className="relative z-10 hidden border-t border-border md:block">
        <div className="container flex items-center justify-between py-5 text-xs text-muted-foreground">
          <p>Unofficial. Data from the public Fantasy Premier League API.</p>
          <div className="flex gap-5">
            <Link to="/status" className="hover:text-foreground">System status</Link>
            <Link to="/about" className="hover:text-foreground">About &amp; privacy</Link>
          </div>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex h-16 items-stretch">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn("flex flex-1 flex-col items-center justify-center gap-1 border-t-2", isActive ? "border-blood text-foreground" : "border-transparent text-muted-foreground")
              }
            >
              <Icon className="h-5 w-5" />
              <span className="font-mono text-[9px] uppercase tracking-widest">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <SignInDialog />
    </div>
  );
}
