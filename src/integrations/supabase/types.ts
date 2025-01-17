export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
