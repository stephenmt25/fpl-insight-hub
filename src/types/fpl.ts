export interface Manager {
  id: number;
  player_first_name: string;
  player_last_name: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;
  current_event: number;
  name: string;
  leagues: {
    classic: League[];
    h2h: League[];
    cup: any;
  };
}

export interface GameweekHistory {
  event: number;
  points: number;
  total_points: number;
  rank: number;
  overall_rank: number;
}

export interface ManagerHistory {
  current: GameweekHistory[];
  past: {
    season_name: string;
    total_points: number;
    rank: number;
  }[];
}

export interface League {
  id: number;
  name: string;
  created: string;
  closed: boolean;
}

export interface LeagueStanding {
  id: number;
  event_total: number;
  player_name: string;
  rank: number;
  last_rank: number;
  rank_sort: number;
  total: number;
  entry: number;
  entry_name: string;
  has_played: boolean;
}

export interface LeagueDetails {
  league: League;
  standings: {
    results: LeagueStanding[];
    has_next: boolean
  };
}

export interface ManagerLeagues {
  leagues: {
    classic: League[];
    h2h: League[];
    cup: any;
  };
}

export interface Event {
  id: number;
  average_entry_score: number;
  finished: boolean;
}

export interface OverallInfo {
  events: Event[];
}