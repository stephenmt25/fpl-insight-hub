export interface ChipDefinition {
  id: number;
  name: string;
  number: number;
  start_event: number;
  stop_event: number;
  chip_type: 'transfer' | 'team';
}

export interface ChipPlay {
  chip_name: string;
  num_played: number;
}

export interface Phase {
  id: number;
  name: string;
  start_event: number;
  stop_event: number;
  highest_score: number | null;
}

export interface TopElementInfo {
  id: number;
  points: number;
}

export interface ScoringRules {
  long_play: number;
  short_play: number;
  goals_scored: Record<string, number>;
  assists: number;
  clean_sheets: Record<string, number>;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  own_goals: number;
  bonus: number;
  defensive_contribution: Record<string, number>;
}

export interface BootstrapEvent {
  id: number;
  name: string;
  deadline_time: string;
  deadline_time_epoch: number;
  average_entry_score: number;
  finished: boolean;
  data_checked: boolean;
  highest_score: number;
  highest_scoring_entry: number;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
  most_selected: number;
  most_transferred_in: number;
  top_element: number;
  top_element_info: TopElementInfo;
  transfers_made: number;
  most_captained: number;
  most_vice_captained: number;
  chip_plays: ChipPlay[];
}

export interface BootstrapElement {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  element_type: number;
  team: number;
  team_code: number;
  now_cost: number;
  form: string;
  total_points: number;
  points_per_game: string;
  selected_by_percent: string;
  ep_next: string;
  ep_this: string;
  event_points: number;
  status: string;
  news: string;
  chance_of_playing_this_round: number | null;
  chance_of_playing_next_round: number | null;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  minutes: number;
  bonus: number;
  bps: number;
  value_form: string;
  value_season: string;
  transfers_in_event: number;
  transfers_out_event: number;
  corners_and_indirect_freekicks_order: number | null;
  direct_freekicks_order: number | null;
  penalties_order: number | null;
  defensive_contribution: number;
  defensive_contribution_per_90: number;
  starts: number;
  starts_per_90: number;
  price_change_percent: number;
}

export interface BootstrapTeam {
  id: number;
  name: string;
  short_name: string;
  code: number;
  position: number;
  played: number;
  win: number;
  draw: number;
  loss: number;
  points: number;
  form: string | null;
  strength: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
}

export interface ElementType {
  id: number;
  plural_name: string;
  plural_name_short: string;
  singular_name: string;
  singular_name_short: string;
  squad_select: number;
  squad_min_select: number;
  squad_max_select: number;
  squad_min_play: number;
  squad_max_play: number;
  element_count: number;
}

export interface BootstrapStatic {
  chips: ChipDefinition[];
  events: BootstrapEvent[];
  phases: Phase[];
  game_settings: Record<string, unknown>;
  game_config: { scoring: ScoringRules };
  teams: BootstrapTeam[];
  elements: BootstrapElement[];
  element_types: ElementType[];
  element_stats: { label: string; name: string }[];
  total_players: number;
}

export interface Fixture {
  id: number;
  code: number;
  event: number;
  finished: boolean;
  kickoff_time: string;
  minutes: number;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  team_h_difficulty: number;
  team_a_difficulty: number;
  started: boolean;
  stats: unknown[];
}
