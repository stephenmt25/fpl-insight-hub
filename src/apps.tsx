import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import {
  Activity, ArrowLeftRight, CalendarRange, ChartLine, Crown, Gem, HeartPulse, Info, ListOrdered,
  PoundSterling, Search, Shield, Telescope, TrendingUp, Trophy, Zap, type LucideIcon,
} from "lucide-react";
import type { Fpl } from "@/lib/fpl/hooks";

export interface AppProps {
  fpl: Fpl;
  /** Set for apps with `needsManager`; empty string otherwise. */
  managerId: string;
}

export type CategoryId = "matchday" | "club" | "scout" | "rivals" | "system";

export const CATEGORIES: { id: CategoryId; name: string; blurb: string }[] = [
  { id: "matchday", name: "Matchday", blurb: "What is happening in the Premier League right now" },
  { id: "club", name: "My Club", blurb: "Your squad and the decisions in front of you" },
  { id: "scout", name: "Scouting", blurb: "Find, compare and forecast players" },
  { id: "rivals", name: "Rivals", blurb: "Mini-leagues and the people you want to beat" },
  { id: "system", name: "System", blurb: "" },
];

export interface AppDef {
  id: string;
  path: string;
  name: string;
  /** One line under the name on the launcher and in the app header. */
  tagline: string;
  category: CategoryId;
  icon: LucideIcon;
  /** Extra words Spotlight matches on. */
  keywords: string;
  /** Needs a signed-in FPL ID. */
  needsManager?: boolean;
  component: LazyExoticComponent<ComponentType<AppProps>>;
}

// Each page file holds several apps; pick one export out of the lazily loaded module.
const from = <M,>(load: () => Promise<M>, pick: (m: M) => ComponentType<AppProps>) =>
  lazy(() => load().then((m) => ({ default: pick(m) })));

const dashboard = () => import("@/pages/Dashboard");
const myTeam = () => import("@/pages/MyTeam");
const players = () => import("@/pages/Players");
const insights = () => import("@/pages/Insights");

export const APPS: AppDef[] = [
  // Matchday
  { id: "gameweek", path: "/gameweek", name: "Gameweek", tagline: "Scores, star players and the team of the week", category: "matchday", icon: Activity,
    keywords: "dashboard live results average highest captain dream team chips season", component: from(dashboard, (m) => m.Gameweek) },
  { id: "fixtures", path: "/fixtures", name: "Fixture Planner", tagline: "Who has the easiest run ahead", category: "matchday", icon: CalendarRange,
    keywords: "fdr difficulty schedule calendar ticker upcoming", component: from(insights, (m) => m.FixtureTicker) },
  { id: "table", path: "/table", name: "League Table", tagline: "The Premier League, computed from every result", category: "matchday", icon: ListOrdered,
    keywords: "premier league standings clubs form points", component: from(insights, (m) => m.LeagueTable) },

  // My Club
  { id: "squad", path: "/squad", name: "Squad", tagline: "Your team on the pitch with live points", category: "club", icon: Shield, needsManager: true,
    keywords: "my team picks lineup bench rank value points", component: from(myTeam, (m) => m.Squad) },
  { id: "captain", path: "/captain", name: "Captain Picker", tagline: "Your fifteen ranked for the armband", category: "club", icon: Crown, needsManager: true,
    keywords: "captaincy armband vice optimiser triple", component: from(myTeam, (m) => m.Captain) },
  { id: "chips", path: "/chips", name: "Chip Planner", tagline: "What you have left and when to play it", category: "club", icon: Zap, needsManager: true,
    keywords: "wildcard free hit bench boost triple captain double blank gameweek", component: from(myTeam, (m) => m.Chips) },
  { id: "transfers", path: "/transfers", name: "Transfer Ledger", tagline: "Did each transfer pay off?", category: "club", icon: ArrowLeftRight, needsManager: true,
    keywords: "transfer impact history bought sold hits", component: from(myTeam, (m) => m.Transfers) },
  { id: "season", path: "/season", name: "Season Trends", tagline: "Points, rank and squad value over time", category: "club", icon: TrendingUp, needsManager: true,
    keywords: "history rank progression past seasons performance", component: from(myTeam, (m) => m.Trends) },

  // Scouting
  { id: "players", path: "/players", name: "Player Explorer", tagline: "Every player, sortable, with head-to-head compare", category: "scout", icon: Search,
    keywords: "search filter stats compare radar price ownership xg", component: from(players, (m) => m.Explorer) },
  { id: "charts", path: "/charts", name: "Chart Builder", tagline: "Plot any players against any measure", category: "scout", icon: ChartLine,
    keywords: "graph plot cumulative xgi history visualise", component: from(players, (m) => m.ChartBuilder) },
  { id: "differentials", path: "/differentials", name: "Differentials", tagline: "Strong players that few managers own", category: "scout", icon: Gem,
    keywords: "hidden gems low ownership clustering k-means picks", component: from(insights, (m) => m.Differentials) },
  { id: "form", path: "/form", name: "Form Forecast", tagline: "Who is heating up, and what comes next", category: "scout", icon: Telescope,
    keywords: "prediction trend momentum projected points", component: from(insights, (m) => m.FormForecastTab) },
  { id: "prices", path: "/prices", name: "Price Watch", tagline: "Likely risers and fallers tonight", category: "scout", icon: PoundSterling,
    keywords: "price change rise fall value transfers market", component: from(insights, (m) => m.PriceWatch) },

  // Rivals
  { id: "leagues", path: "/leagues", name: "Mini-Leagues", tagline: "Standings, insights and the title race", category: "rivals", icon: Trophy,
    keywords: "league standings rivals classic overall rank race", component: lazy(() => import("@/pages/Leagues")) },

  // System
  { id: "status", path: "/status", name: "System Status", tagline: "Live check of every data endpoint", category: "system", icon: HeartPulse,
    keywords: "diagnostics api health endpoints", component: lazy(() => import("@/pages/Status")) },
  { id: "about", path: "/about", name: "About", tagline: "Privacy, terms and credits", category: "system", icon: Info,
    keywords: "privacy terms credits legal", component: lazy(() => import("@/pages/About")) },
];

export const appById = (id: string) => APPS.find((a) => a.id === id);

/** Old URLs from before the launcher. */
export const REDIRECTS: Record<string, string> = {
  "/my-team": "/squad", "/performance": "/squad", "/insights": "/differentials", "/explore": "/players",
  "/league": "/leagues", "/standings": "/leagues", "/testing": "/status", "/privacy": "/about", "/terms": "/about", "/credits": "/about",
};

const RECENTS_KEY = "fpl-insight-hub.recent-apps";

export function getRecents(): string[] {
  try {
    const ids = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]") as string[];
    return ids.filter((id) => appById(id));
  } catch {
    return [];
  }
}

export function pushRecent(id: string) {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify([id, ...getRecents().filter((x) => x !== id)].slice(0, 6)));
  } catch {
    /* private mode */
  }
}

/** Apps to put forward first, given what we know about the visitor and the calendar. */
export function suggestApps({ signedIn, hoursToDeadline }: { signedIn: boolean; hoursToDeadline: number | null }): AppDef[] {
  const deadlineSoon = hoursToDeadline != null && hoursToDeadline < 72;
  const ids = signedIn
    ? deadlineSoon ? ["captain", "squad", "prices", "fixtures"] : ["squad", "transfers", "differentials", "leagues"]
    : deadlineSoon ? ["gameweek", "prices", "differentials", "fixtures"] : ["gameweek", "players", "differentials", "form"];
  return ids.map((id) => appById(id)!);
}
