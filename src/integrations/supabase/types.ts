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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      deposit_events: {
        Row: {
          block_number: number
          chips_granted: number
          created_at: string
          event_type: string
          id: string
          processed: boolean
          tx_hash: string
          wallet_address: string
          wover_amount: number
        }
        Insert: {
          block_number: number
          chips_granted: number
          created_at?: string
          event_type: string
          id?: string
          processed?: boolean
          tx_hash: string
          wallet_address: string
          wover_amount: number
        }
        Update: {
          block_number?: number
          chips_granted?: number
          created_at?: string
          event_type?: string
          id?: string
          processed?: boolean
          tx_hash?: string
          wallet_address?: string
          wover_amount?: number
        }
        Relationships: []
      }
      game_actions: {
        Row: {
          action: string
          amount: number | null
          created_at: string
          id: string
          phase: string | null
          player_wallet: string
          table_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          amount?: number | null
          created_at?: string
          id?: string
          phase?: string | null
          player_wallet: string
          table_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          amount?: number | null
          created_at?: string
          id?: string
          phase?: string | null
          player_wallet?: string
          table_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_actions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_actions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      game_settlements: {
        Row: {
          created_at: string
          id: string
          settled_at: string
          settlement_data: Json
          table_id: string
          tx_hash: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          settled_at?: string
          settlement_data: Json
          table_id: string
          tx_hash?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          settled_at?: string
          settlement_data?: Json
          table_id?: string
          tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_settlements_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_settlements_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          id: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      player_balances: {
        Row: {
          available_chips: number
          created_at: string
          id: string
          last_deposit_tx: string | null
          last_sync_block: number | null
          last_withdrawal_tx: string | null
          locked_in_games: number
          on_chain_chips: number
          total_deposited_wover: number
          total_withdrawn_wover: number
          updated_at: string
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          available_chips?: number
          created_at?: string
          id?: string
          last_deposit_tx?: string | null
          last_sync_block?: number | null
          last_withdrawal_tx?: string | null
          locked_in_games?: number
          on_chain_chips?: number
          total_deposited_wover?: number
          total_withdrawn_wover?: number
          updated_at?: string
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          available_chips?: number
          created_at?: string
          id?: string
          last_deposit_tx?: string | null
          last_sync_block?: number | null
          last_withdrawal_tx?: string | null
          locked_in_games?: number
          on_chain_chips?: number
          total_deposited_wover?: number
          total_withdrawn_wover?: number
          updated_at?: string
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      player_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
          username: string
          wallet_address: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
          username: string
          wallet_address: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
          username?: string
          wallet_address?: string
        }
        Relationships: []
      }
      poker_tables: {
        Row: {
          active_player_seat: number | null
          allowed_players: string[] | null
          big_blind: number
          community_cards: Json
          created_at: string
          creation_fee_token: string | null
          creation_fee_tx: string | null
          creator_wallet: string | null
          current_bet: number
          current_phase: string
          dealer_position: number
          id: string
          is_private: boolean | null
          max_players: number
          name: string
          password_protected: boolean | null
          pot: number
          small_blind: number
          status: string
          table_password: string | null
          updated_at: string
        }
        Insert: {
          active_player_seat?: number | null
          allowed_players?: string[] | null
          big_blind?: number
          community_cards?: Json
          created_at?: string
          creation_fee_token?: string | null
          creation_fee_tx?: string | null
          creator_wallet?: string | null
          current_bet?: number
          current_phase?: string
          dealer_position?: number
          id?: string
          is_private?: boolean | null
          max_players?: number
          name: string
          password_protected?: boolean | null
          pot?: number
          small_blind?: number
          status?: string
          table_password?: string | null
          updated_at?: string
        }
        Update: {
          active_player_seat?: number | null
          allowed_players?: string[] | null
          big_blind?: number
          community_cards?: Json
          created_at?: string
          creation_fee_token?: string | null
          creation_fee_tx?: string | null
          creator_wallet?: string | null
          current_bet?: number
          current_phase?: string
          dealer_position?: number
          id?: string
          is_private?: boolean | null
          max_players?: number
          name?: string
          password_protected?: boolean | null
          pot?: number
          small_blind?: number
          status?: string
          table_password?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      table_chat: {
        Row: {
          created_at: string
          id: string
          message: string
          player_name: string | null
          player_wallet: string
          table_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          player_name?: string | null
          player_wallet: string
          table_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          player_name?: string | null
          player_wallet?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_chat_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_chat_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      table_seats: {
        Row: {
          cards: Json | null
          chip_stack: number
          created_at: string
          current_bet: number
          id: string
          is_big_blind: boolean
          is_dealer: boolean
          is_folded: boolean
          is_small_blind: boolean
          is_turn: boolean
          last_action: string | null
          on_chain_buy_in: number
          player_name: string | null
          player_wallet: string | null
          seat_number: number
          table_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cards?: Json | null
          chip_stack?: number
          created_at?: string
          current_bet?: number
          id?: string
          is_big_blind?: boolean
          is_dealer?: boolean
          is_folded?: boolean
          is_small_blind?: boolean
          is_turn?: boolean
          last_action?: string | null
          on_chain_buy_in?: number
          player_name?: string | null
          player_wallet?: string | null
          seat_number: number
          table_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cards?: Json | null
          chip_stack?: number
          created_at?: string
          current_bet?: number
          id?: string
          is_big_blind?: boolean
          is_dealer?: boolean
          is_folded?: boolean
          is_small_blind?: boolean
          is_turn?: boolean
          last_action?: string | null
          on_chain_buy_in?: number
          player_name?: string | null
          player_wallet?: string | null
          seat_number?: number
          table_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "table_seats_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_seats_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          eliminated_at: string | null
          id: string
          is_eliminated: boolean | null
          payout_amount: number | null
          placement: number | null
          registered_at: string | null
          tournament_id: string | null
          username: string
          wallet_address: string
        }
        Insert: {
          eliminated_at?: string | null
          id?: string
          is_eliminated?: boolean | null
          payout_amount?: number | null
          placement?: number | null
          registered_at?: string | null
          tournament_id?: string | null
          username: string
          wallet_address: string
        }
        Update: {
          eliminated_at?: string | null
          id?: string
          is_eliminated?: boolean | null
          payout_amount?: number | null
          placement?: number | null
          registered_at?: string | null
          tournament_id?: string | null
          username?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          blind_structure: Json
          created_at: string | null
          created_by: string
          entry_chips: number
          entry_wover_value: number
          finished_at: string | null
          id: string
          max_players: number
          name: string
          payout_percentages: Json
          payout_structure: Database["public"]["Enums"]["payout_structure"]
          platform_rake_percent: number | null
          prize_pool: number | null
          started_at: string | null
          starting_stack: number
          status: Database["public"]["Enums"]["tournament_status"] | null
          tournament_type: Database["public"]["Enums"]["tournament_type"]
        }
        Insert: {
          blind_structure: Json
          created_at?: string | null
          created_by: string
          entry_chips: number
          entry_wover_value: number
          finished_at?: string | null
          id?: string
          max_players: number
          name: string
          payout_percentages: Json
          payout_structure: Database["public"]["Enums"]["payout_structure"]
          platform_rake_percent?: number | null
          prize_pool?: number | null
          started_at?: string | null
          starting_stack: number
          status?: Database["public"]["Enums"]["tournament_status"] | null
          tournament_type: Database["public"]["Enums"]["tournament_type"]
        }
        Update: {
          blind_structure?: Json
          created_at?: string | null
          created_by?: string
          entry_chips?: number
          entry_wover_value?: number
          finished_at?: string | null
          id?: string
          max_players?: number
          name?: string
          payout_percentages?: Json
          payout_structure?: Database["public"]["Enums"]["payout_structure"]
          platform_rake_percent?: number | null
          prize_pool?: number | null
          started_at?: string | null
          starting_stack?: number
          status?: Database["public"]["Enums"]["tournament_status"] | null
          tournament_type?: Database["public"]["Enums"]["tournament_type"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          connected_at: string | null
          id: string
          is_primary: boolean | null
          label: string | null
          last_used_at: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          connected_at?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          last_used_at?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          connected_at?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          last_used_at?: string | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      world_chat: {
        Row: {
          created_at: string | null
          id: string
          message: string
          username: string
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          username: string
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          username?: string
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      poker_tables_safe: {
        Row: {
          active_player_seat: number | null
          allowed_players: string[] | null
          big_blind: number | null
          community_cards: Json | null
          created_at: string | null
          creation_fee_token: string | null
          creation_fee_tx: string | null
          creator_wallet: string | null
          current_bet: number | null
          current_phase: string | null
          dealer_position: number | null
          id: string | null
          is_private: boolean | null
          max_players: number | null
          name: string | null
          password_protected: boolean | null
          pot: number | null
          small_blind: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          active_player_seat?: number | null
          allowed_players?: string[] | null
          big_blind?: number | null
          community_cards?: Json | null
          created_at?: string | null
          creation_fee_token?: string | null
          creation_fee_tx?: string | null
          creator_wallet?: string | null
          current_bet?: number | null
          current_phase?: string | null
          dealer_position?: number | null
          id?: string | null
          is_private?: boolean | null
          max_players?: number | null
          name?: string | null
          password_protected?: boolean | null
          pot?: number | null
          small_blind?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          active_player_seat?: number | null
          allowed_players?: string[] | null
          big_blind?: number | null
          community_cards?: Json | null
          created_at?: string | null
          creation_fee_token?: string | null
          creation_fee_tx?: string | null
          creator_wallet?: string | null
          current_bet?: number | null
          current_phase?: string | null
          dealer_position?: number | null
          id?: string | null
          is_private?: boolean | null
          max_players?: number | null
          name?: string | null
          password_protected?: boolean | null
          pot?: number | null
          small_blind?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      table_seats_safe: {
        Row: {
          cards: Json | null
          chip_stack: number | null
          created_at: string | null
          current_bet: number | null
          id: string | null
          is_big_blind: boolean | null
          is_dealer: boolean | null
          is_folded: boolean | null
          is_small_blind: boolean | null
          is_turn: boolean | null
          last_action: string | null
          on_chain_buy_in: number | null
          player_name: string | null
          player_wallet: string | null
          seat_number: number | null
          table_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cards?: never
          chip_stack?: number | null
          created_at?: string | null
          current_bet?: number | null
          id?: string | null
          is_big_blind?: boolean | null
          is_dealer?: boolean | null
          is_folded?: boolean | null
          is_small_blind?: boolean | null
          is_turn?: boolean | null
          last_action?: string | null
          on_chain_buy_in?: number | null
          player_name?: string | null
          player_wallet?: string | null
          seat_number?: number | null
          table_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cards?: never
          chip_stack?: number | null
          created_at?: string | null
          current_bet?: number | null
          id?: string | null
          is_big_blind?: boolean | null
          is_dealer?: boolean | null
          is_folded?: boolean | null
          is_small_blind?: boolean | null
          is_turn?: boolean | null
          last_action?: string | null
          on_chain_buy_in?: number | null
          player_name?: string | null
          player_wallet?: string | null
          seat_number?: number | null
          table_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "table_seats_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_seats_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables_safe"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_visible_seat_cards: {
        Args: {
          requesting_wallet: string
          seat_cards: Json
          seat_player_wallet: string
        }
        Returns: Json
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _wallet: string
            }
            Returns: boolean
          }
      is_table_creator: {
        Args: { table_creator: string; user_wallet: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      payout_structure: "winner_takes_all" | "top_3" | "top_2"
      tournament_status: "registering" | "running" | "finished" | "cancelled"
      tournament_type: "sit_and_go" | "heads_up" | "winner_takes_all"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      payout_structure: ["winner_takes_all", "top_3", "top_2"],
      tournament_status: ["registering", "running", "finished", "cancelled"],
      tournament_type: ["sit_and_go", "heads_up", "winner_takes_all"],
    },
  },
} as const
