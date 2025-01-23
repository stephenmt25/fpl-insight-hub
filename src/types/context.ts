import { Manager, ManagerHistory, GameweekPicks } from "./fpl";

export interface LiveGWContextType {
  liveGameweekData: {
    id: number;
    average_entry_score?: number;
    highest_score?: number;
    most_captained?: number;
    most_vice_captained?: number;
  } | null;
  updateLiveGWData: (data: any) => void;
  eventStatus: EventStatus | null;
  updateOverallData: (data: any) => void;
  overallData: OverallData[] | null;
}

export interface EventStatus {
  status: StatusItem[];
  leagues: string;
}

export interface StatusItem {
  bonus_added: boolean;
  date: string;
  event: number;
  points: string;
}

export interface OverallData {
  id: number;
  average_entry_score: number;
  highest_score: number;
  most_captained: number;
  most_vice_captained: number;
  finished: boolean;
}

export interface AuthContextType {
  isSignedIn: boolean;
  fplId: string | null;
  signIn: (id: string, manager: Manager) => void;
  signOut: () => void;
  updateManagerHistory: (history: ManagerHistory) => void;
  currentManager: Manager | null;
  managerHistory: ManagerHistory | null;
  currentGameweekPicks: GameweekPicks | null;
  updateGameweekPicks: (picks: GameweekPicks) => void;
}