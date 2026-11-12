// Shapes of the public Fantasy Premier League API (only the fields this app reads).

export interface ChipPlay {
  chip_name: string;
  num_played: number;
}

export interface FplEvent {
  id: number;
  name: string;
  deadline_time: string;
  average_entry_score: number;
  finished: boolean;
  data_checked: boolean;
  highest_score: number | null;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
  most_selected: number | null;
  most_transferred_in: number | null;
  top_element: number | null;
  top_element_info: { id: number; points: number } | null;
  transfers_made: number;
  most_captained: number | null;
  most_vice_captained: number | null;
  chip_plays: ChipPlay[];
}

export interface PriceProjection {
  offset: number;
  projected_percent: string;
  likelihood: number;
}

export interface Player {
  id: number;
  code: number;
  first_name: string;
  second_name: string;
  web_name: string;
  element_type: number;
  team: number;
  now_cost: number;
  cost_change_event: number;
  cost_change_start: number;
  price_change_percent?: number | string | null;
  price_change_projections?: PriceProjection[] | null;
  form: string;
  total_points: number;
  event_points: number;
  points_per_game: string;
  selected_by_percent: string;
  ep_next: string | null;
  status: string;
  news: string;
  chance_of_playing_next_round: number | null;
  minutes: number;
  starts: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  defensive_contribution?: number;
  transfers_in_event: number;
  transfers_out_event: number;
  penalties_order: number | null;
}

export interface Team {
  id: number;
  code: number;
  name: string;
  short_name: string;
}

export interface ChipDefinition {
  id: number;
  name: string;
  number: number;
  start_event: number;
  stop_event: number;
}

export interface Bootstrap {
  events: FplEvent[];
  teams: Team[];
  elements: Player[];
  chips: ChipDefinition[];
  total_players: number;
}

export interface Fixture {
  id: number;
  event: number | null;
  kickoff_time: string | null;
  started: boolean;
  finished: boolean;
  minutes: number;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  team_h_difficulty: number;
  team_a_difficulty: number;
}

export interface LiveElement {
  id: number;
  stats: { total_points: number; minutes: number; goals_scored: number; assists: number; bonus: number; bps: number };
}
export interface EventLive {
  elements: LiveElement[];
}

export interface PlayerHistoryRow {
  round: number;
  fixture: number;
  opponent_team: number;
  was_home: boolean;
  kickoff_time: string;
  team_h_score: number | null;
  team_a_score: number | null;
  total_points: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  value: number;
  selected: number;
}

export interface PlayerUpcomingFixture {
  id: number;
  event: number | null;
  team_h: number;
  team_a: number;
  is_home: boolean;
  difficulty: number;
  kickoff_time: string | null;
}

export interface PlayerSummary {
  history: PlayerHistoryRow[];
  fixtures: PlayerUpcomingFixture[];
}

export interface ClassicLeagueRef {
  id: number;
  name: string;
  league_type: string;
  entry_rank: number | null;
  entry_last_rank: number | null;
  rank_count: number | null;
}

export interface Entry {
  id: number;
  name: string;
  player_first_name: string;
  player_last_name: string;
  player_region_name: string;
  favourite_team: number | null;
  years_active?: number;
  current_event: number | null;
  summary_overall_points: number | null;
  summary_overall_rank: number | null;
  summary_event_points: number | null;
  summary_event_rank: number | null;
  last_deadline_bank: number | null;
  last_deadline_value: number | null;
  leagues: { classic: ClassicLeagueRef[] };
}

export interface EntryEventHistory {
  event: number;
  points: number;
  total_points: number;
  rank: number | null;
  overall_rank: number | null;
  bank: number;
  value: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

export interface EntryHistory {
  current: EntryEventHistory[];
  past: { season_name: string; total_points: number; rank: number }[];
  chips: { name: string; event: number; time: string }[];
}

export interface Pick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface EntryPicks {
  active_chip: string | null;
  automatic_subs: { element_in: number; element_out: number; event: number }[];
  entry_history: EntryEventHistory;
  picks: Pick[];
}

export interface Transfer {
  element_in: number;
  element_in_cost: number;
  element_out: number;
  element_out_cost: number;
  event: number;
  time: string;
}

export interface StandingRow {
  entry: number;
  entry_name: string;
  player_name: string;
  rank: number;
  last_rank: number;
  event_total: number;
  total: number;
}

export interface LeagueStandings {
  league: { id: number; name: string };
  standings: { has_next: boolean; page: number; results: StandingRow[] };
}

export interface DreamTeam {
  top_player: { id: number; points: number } | null;
  team: { element: number; points: number; position: number }[];
}

export interface EventStatus {
  status: { bonus_added: boolean; date: string; event: number; points: string }[];
  leagues: string;
}
