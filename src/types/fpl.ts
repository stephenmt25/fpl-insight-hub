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

export interface PlayerFixture {
  id: number;
  kickoff_time: string;
  gameweek: number;
  is_home: boolean;
  difficulty: number;
  team_h: number;
  team_a: number;
  finished: boolean;
}

export interface PlayerStats {
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  expected_goals: string;
  expected_assists: string;
}

export interface PlayerSummary {
  fixtures: PlayerFixture[];
  history: PlayerStats[];
}

export interface GameweekPlayerStats {
  elements: {
    id: number;
    stats: PlayerStats;
    explain: any[];
  }[];
}

export interface ManagerTransfers {
  element_in: number;
  element_in_cost: number;
  element_out: number;
  element_out_cost: number;
  entry: number;
  event: number;
  time: string;
}

export interface Pick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface GameweekPicks {
  active_chip: string | null;
  automatic_subs: any[];
  entry_history: {
    event: number;
    points: number;
    total_points: number;
    rank: number;
    rank_sort: number;
    overall_rank: number;
    bank: number;
    value: number;
    event_transfers: number;
    event_transfers_cost: number;
    points_on_bench: number;
  };
  picks: Pick[];
}
