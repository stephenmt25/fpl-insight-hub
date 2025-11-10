export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      fploveralldata: {
        Row: {
          average_entry_score: number | null
          can_enter: string | null
          can_manage: string | null
          cup_leagues_created: string | null
          data_checked: Json | null
          deadline_time: string | null
          deadline_time_epoch: number | null
          finished: Json | null
          h2h_ko_matches_created: string | null
          highest_score: number | null
          highest_scoring_entry: number | null
          id: number
          is_current: string | null
          is_next: string | null
          is_previous: string | null
          most_captained: number | null
          most_selected: number | null
          most_transferred_in: number | null
          most_vice_captained: number | null
          name: string | null
          points: number | null
          ranked_count: number | null
          released: Json | null
          top_element: number | null
          transfers_made: string | null
        }
        Insert: {
          average_entry_score?: number | null
          can_enter?: string | null
          can_manage?: string | null
          cup_leagues_created?: string | null
          data_checked?: Json | null
          deadline_time?: string | null
          deadline_time_epoch?: number | null
          finished?: Json | null
          h2h_ko_matches_created?: string | null
          highest_score?: number | null
          highest_scoring_entry?: number | null
          id: number
          is_current?: string | null
          is_next?: string | null
          is_previous?: string | null
          most_captained?: number | null
          most_selected?: number | null
          most_transferred_in?: number | null
          most_vice_captained?: number | null
          name?: string | null
          points?: number | null
          ranked_count?: number | null
          released?: Json | null
          top_element?: number | null
          transfers_made?: string | null
        }
        Update: {
          average_entry_score?: number | null
          can_enter?: string | null
          can_manage?: string | null
          cup_leagues_created?: string | null
          data_checked?: Json | null
          deadline_time?: string | null
          deadline_time_epoch?: number | null
          finished?: Json | null
          h2h_ko_matches_created?: string | null
          highest_score?: number | null
          highest_scoring_entry?: number | null
          id?: number
          is_current?: string | null
          is_next?: string | null
          is_previous?: string | null
          most_captained?: number | null
          most_selected?: number | null
          most_transferred_in?: number | null
          most_vice_captained?: number | null
          name?: string | null
          points?: number | null
          ranked_count?: number | null
          released?: Json | null
          top_element?: number | null
          transfers_made?: string | null
        }
        Relationships: []
      }
      player_gameweek_history: {
        Row: {
          assists: number | null
          bonus: number | null
          bps: number | null
          created_at: string | null
          expected_assists: number | null
          expected_goals: number | null
          fixture_difficulty: number | null
          form: number | null
          gameweek: number
          goals_scored: number | null
          id: string
          minutes: number | null
          opponent_team: number | null
          player_id: number
          points: number | null
          was_home: boolean | null
        }
        Insert: {
          assists?: number | null
          bonus?: number | null
          bps?: number | null
          created_at?: string | null
          expected_assists?: number | null
          expected_goals?: number | null
          fixture_difficulty?: number | null
          form?: number | null
          gameweek: number
          goals_scored?: number | null
          id?: string
          minutes?: number | null
          opponent_team?: number | null
          player_id: number
          points?: number | null
          was_home?: boolean | null
        }
        Update: {
          assists?: number | null
          bonus?: number | null
          bps?: number | null
          created_at?: string | null
          expected_assists?: number | null
          expected_goals?: number | null
          fixture_difficulty?: number | null
          form?: number | null
          gameweek?: number
          goals_scored?: number | null
          id?: string
          minutes?: number | null
          opponent_team?: number | null
          player_id?: number
          points?: number | null
          was_home?: boolean | null
        }
        Relationships: []
      }
      plplayerdata: {
        Row: {
          assists: string | null
          bonus: string | null
          bps: string | null
          chance_of_playing_next_round: string | null
          chance_of_playing_this_round: string | null
          clean_sheets: string | null
          clean_sheets_per_90: string | null
          code: number | null
          corners_and_indirect_freekicks_order: string | null
          corners_and_indirect_freekicks_text: string | null
          cost_change_event: string | null
          cost_change_event_fall: string | null
          cost_change_start: number | null
          cost_change_start_fall: number | null
          creativity: string | null
          creativity_rank: number | null
          creativity_rank_type: number | null
          direct_freekicks_order: string | null
          direct_freekicks_text: string | null
          dreamteam_count: string | null
          element_type: number | null
          ep_next: string | null
          ep_this: string | null
          event_points: string | null
          expected_assists: string | null
          expected_assists_per_90: string | null
          expected_goal_involvements: string | null
          expected_goal_involvements_per_90: string | null
          expected_goals: string | null
          expected_goals_conceded: string | null
          expected_goals_conceded_per_90: string | null
          expected_goals_per_90: string | null
          first_name: string | null
          form: string | null
          form_rank: number | null
          form_rank_type: number | null
          goals_conceded: string | null
          goals_conceded_per_90: string | null
          goals_scored: string | null
          ict_index: string | null
          ict_index_rank: number | null
          ict_index_rank_type: number | null
          id: number
          in_dreamteam: boolean | null
          influence: string | null
          influence_rank: number | null
          influence_rank_type: number | null
          minutes: string | null
          news: string | null
          news_added: string | null
          now_cost: number | null
          now_cost_rank: number | null
          now_cost_rank_type: number | null
          own_goals: string | null
          penalties_missed: string | null
          penalties_order: string | null
          penalties_saved: string | null
          penalties_text: string | null
          photo: string | null
          points_per_game: string | null
          points_per_game_rank: number | null
          points_per_game_rank_type: number | null
          red_cards: string | null
          region: string | null
          removed: boolean | null
          saves: string | null
          saves_per_90: string | null
          second_name: string | null
          selected_by_percent: string | null
          selected_rank: number | null
          selected_rank_type: number | null
          special: boolean | null
          squad_number: string | null
          starts: string | null
          starts_per_90: string | null
          status: string | null
          team: number | null
          team_code: number | null
          team_join_date: string | null
          threat: string | null
          threat_rank: number | null
          threat_rank_type: number | null
          total_points: string | null
          transfers_in: number | null
          transfers_in_event: string | null
          transfers_out: number | null
          transfers_out_event: number | null
          value_form: string | null
          value_season: string | null
          web_name: string | null
          yellow_cards: string | null
        }
        Insert: {
          assists?: string | null
          bonus?: string | null
          bps?: string | null
          chance_of_playing_next_round?: string | null
          chance_of_playing_this_round?: string | null
          clean_sheets?: string | null
          clean_sheets_per_90?: string | null
          code?: number | null
          corners_and_indirect_freekicks_order?: string | null
          corners_and_indirect_freekicks_text?: string | null
          cost_change_event?: string | null
          cost_change_event_fall?: string | null
          cost_change_start?: number | null
          cost_change_start_fall?: number | null
          creativity?: string | null
          creativity_rank?: number | null
          creativity_rank_type?: number | null
          direct_freekicks_order?: string | null
          direct_freekicks_text?: string | null
          dreamteam_count?: string | null
          element_type?: number | null
          ep_next?: string | null
          ep_this?: string | null
          event_points?: string | null
          expected_assists?: string | null
          expected_assists_per_90?: string | null
          expected_goal_involvements?: string | null
          expected_goal_involvements_per_90?: string | null
          expected_goals?: string | null
          expected_goals_conceded?: string | null
          expected_goals_conceded_per_90?: string | null
          expected_goals_per_90?: string | null
          first_name?: string | null
          form?: string | null
          form_rank?: number | null
          form_rank_type?: number | null
          goals_conceded?: string | null
          goals_conceded_per_90?: string | null
          goals_scored?: string | null
          ict_index?: string | null
          ict_index_rank?: number | null
          ict_index_rank_type?: number | null
          id: number
          in_dreamteam?: boolean | null
          influence?: string | null
          influence_rank?: number | null
          influence_rank_type?: number | null
          minutes?: string | null
          news?: string | null
          news_added?: string | null
          now_cost?: number | null
          now_cost_rank?: number | null
          now_cost_rank_type?: number | null
          own_goals?: string | null
          penalties_missed?: string | null
          penalties_order?: string | null
          penalties_saved?: string | null
          penalties_text?: string | null
          photo?: string | null
          points_per_game?: string | null
          points_per_game_rank?: number | null
          points_per_game_rank_type?: number | null
          red_cards?: string | null
          region?: string | null
          removed?: boolean | null
          saves?: string | null
          saves_per_90?: string | null
          second_name?: string | null
          selected_by_percent?: string | null
          selected_rank?: number | null
          selected_rank_type?: number | null
          special?: boolean | null
          squad_number?: string | null
          starts?: string | null
          starts_per_90?: string | null
          status?: string | null
          team?: number | null
          team_code?: number | null
          team_join_date?: string | null
          threat?: string | null
          threat_rank?: number | null
          threat_rank_type?: number | null
          total_points?: string | null
          transfers_in?: number | null
          transfers_in_event?: string | null
          transfers_out?: number | null
          transfers_out_event?: number | null
          value_form?: string | null
          value_season?: string | null
          web_name?: string | null
          yellow_cards?: string | null
        }
        Update: {
          assists?: string | null
          bonus?: string | null
          bps?: string | null
          chance_of_playing_next_round?: string | null
          chance_of_playing_this_round?: string | null
          clean_sheets?: string | null
          clean_sheets_per_90?: string | null
          code?: number | null
          corners_and_indirect_freekicks_order?: string | null
          corners_and_indirect_freekicks_text?: string | null
          cost_change_event?: string | null
          cost_change_event_fall?: string | null
          cost_change_start?: number | null
          cost_change_start_fall?: number | null
          creativity?: string | null
          creativity_rank?: number | null
          creativity_rank_type?: number | null
          direct_freekicks_order?: string | null
          direct_freekicks_text?: string | null
          dreamteam_count?: string | null
          element_type?: number | null
          ep_next?: string | null
          ep_this?: string | null
          event_points?: string | null
          expected_assists?: string | null
          expected_assists_per_90?: string | null
          expected_goal_involvements?: string | null
          expected_goal_involvements_per_90?: string | null
          expected_goals?: string | null
          expected_goals_conceded?: string | null
          expected_goals_conceded_per_90?: string | null
          expected_goals_per_90?: string | null
          first_name?: string | null
          form?: string | null
          form_rank?: number | null
          form_rank_type?: number | null
          goals_conceded?: string | null
          goals_conceded_per_90?: string | null
          goals_scored?: string | null
          ict_index?: string | null
          ict_index_rank?: number | null
          ict_index_rank_type?: number | null
          id?: number
          in_dreamteam?: boolean | null
          influence?: string | null
          influence_rank?: number | null
          influence_rank_type?: number | null
          minutes?: string | null
          news?: string | null
          news_added?: string | null
          now_cost?: number | null
          now_cost_rank?: number | null
          now_cost_rank_type?: number | null
          own_goals?: string | null
          penalties_missed?: string | null
          penalties_order?: string | null
          penalties_saved?: string | null
          penalties_text?: string | null
          photo?: string | null
          points_per_game?: string | null
          points_per_game_rank?: number | null
          points_per_game_rank_type?: number | null
          red_cards?: string | null
          region?: string | null
          removed?: boolean | null
          saves?: string | null
          saves_per_90?: string | null
          second_name?: string | null
          selected_by_percent?: string | null
          selected_rank?: number | null
          selected_rank_type?: number | null
          special?: boolean | null
          squad_number?: string | null
          starts?: string | null
          starts_per_90?: string | null
          status?: string | null
          team?: number | null
          team_code?: number | null
          team_join_date?: string | null
          threat?: string | null
          threat_rank?: number | null
          threat_rank_type?: number | null
          total_points?: string | null
          transfers_in?: number | null
          transfers_in_event?: string | null
          transfers_out?: number | null
          transfers_out_event?: number | null
          value_form?: string | null
          value_season?: string | null
          web_name?: string | null
          yellow_cards?: string | null
        }
        Relationships: []
      }
      plteams: {
        Row: {
          code: number | null
          draw: string | null
          form: string | null
          id: number
          loss: string | null
          name: string | null
          played: string | null
          points: string | null
          position: string | null
          pulse_id: number | null
          short_name: string | null
          strength: number | null
          strength_attack_away: number | null
          strength_attack_home: number | null
          strength_defence_away: number | null
          strength_defence_home: number | null
          strength_overall_away: number | null
          strength_overall_home: number | null
          team_division: string | null
          unavailable: boolean | null
          win: string | null
        }
        Insert: {
          code?: number | null
          draw?: string | null
          form?: string | null
          id: number
          loss?: string | null
          name?: string | null
          played?: string | null
          points?: string | null
          position?: string | null
          pulse_id?: number | null
          short_name?: string | null
          strength?: number | null
          strength_attack_away?: number | null
          strength_attack_home?: number | null
          strength_defence_away?: number | null
          strength_defence_home?: number | null
          strength_overall_away?: number | null
          strength_overall_home?: number | null
          team_division?: string | null
          unavailable?: boolean | null
          win?: string | null
        }
        Update: {
          code?: number | null
          draw?: string | null
          form?: string | null
          id?: number
          loss?: string | null
          name?: string | null
          played?: string | null
          points?: string | null
          position?: string | null
          pulse_id?: number | null
          short_name?: string | null
          strength?: number | null
          strength_attack_away?: number | null
          strength_attack_home?: number | null
          strength_defence_away?: number | null
          strength_defence_home?: number | null
          strength_overall_away?: number | null
          strength_overall_home?: number | null
          team_division?: string | null
          unavailable?: boolean | null
          win?: string | null
        }
        Relationships: []
      }
      price_change_history: {
        Row: {
          created_at: string | null
          date: string
          form: number | null
          id: string
          new_price: number
          old_price: number
          ownership_percent: number | null
          player_id: number
          transfers_in_24h: number | null
          transfers_out_24h: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          form?: number | null
          id?: string
          new_price: number
          old_price: number
          ownership_percent?: number | null
          player_id: number
          transfers_in_24h?: number | null
          transfers_out_24h?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          form?: number | null
          id?: string
          new_price?: number
          old_price?: number
          ownership_percent?: number | null
          player_id?: number
          transfers_in_24h?: number | null
          transfers_out_24h?: number | null
        }
        Relationships: []
      }
      upcoming_fixtures_enriched: {
        Row: {
          away_attack_strength: number | null
          away_defense_strength: number | null
          away_difficulty: number | null
          away_team_id: number
          created_at: string | null
          fixture_id: number
          gameweek: number
          home_attack_strength: number | null
          home_defense_strength: number | null
          home_difficulty: number | null
          home_team_id: number
          id: string
          kickoff_time: string | null
        }
        Insert: {
          away_attack_strength?: number | null
          away_defense_strength?: number | null
          away_difficulty?: number | null
          away_team_id: number
          created_at?: string | null
          fixture_id: number
          gameweek: number
          home_attack_strength?: number | null
          home_defense_strength?: number | null
          home_difficulty?: number | null
          home_team_id: number
          id?: string
          kickoff_time?: string | null
        }
        Update: {
          away_attack_strength?: number | null
          away_defense_strength?: number | null
          away_difficulty?: number | null
          away_team_id?: number
          created_at?: string | null
          fixture_id?: number
          gameweek?: number
          home_attack_strength?: number | null
          home_defense_strength?: number | null
          home_difficulty?: number | null
          home_team_id?: number
          id?: string
          kickoff_time?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
