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
        }
        Insert: {
          action: string
          amount?: number | null
          created_at?: string
          id?: string
          phase?: string | null
          player_wallet: string
          table_id: string
        }
        Update: {
          action?: string
          amount?: number | null
          created_at?: string
          id?: string
          phase?: string | null
          player_wallet?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_actions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables"
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
        ]
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
          wallet_address?: string
        }
        Relationships: []
      }
      poker_tables: {
        Row: {
          active_player_seat: number | null
          big_blind: number
          community_cards: Json
          created_at: string
          current_bet: number
          current_phase: string
          dealer_position: number
          id: string
          max_players: number
          name: string
          pot: number
          small_blind: number
          status: string
          updated_at: string
        }
        Insert: {
          active_player_seat?: number | null
          big_blind?: number
          community_cards?: Json
          created_at?: string
          current_bet?: number
          current_phase?: string
          dealer_position?: number
          id?: string
          max_players?: number
          name: string
          pot?: number
          small_blind?: number
          status?: string
          updated_at?: string
        }
        Update: {
          active_player_seat?: number | null
          big_blind?: number
          community_cards?: Json
          created_at?: string
          current_bet?: number
          current_phase?: string
          dealer_position?: number
          id?: string
          max_players?: number
          name?: string
          pot?: number
          small_blind?: number
          status?: string
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
        }
        Relationships: [
          {
            foreignKeyName: "table_seats_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables"
            referencedColumns: ["id"]
          },
        ]
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
