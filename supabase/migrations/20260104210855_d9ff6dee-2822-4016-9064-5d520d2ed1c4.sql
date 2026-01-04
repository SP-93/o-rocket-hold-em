-- Fix SECURITY DEFINER views - change to SECURITY INVOKER
-- This ensures the views run with the permissions of the querying user

-- Recreate table_seats_safe with SECURITY INVOKER
DROP VIEW IF EXISTS table_seats_safe;
CREATE VIEW table_seats_safe 
WITH (security_invoker = true)
AS
SELECT 
  id, table_id, seat_number, player_wallet, player_name,
  chip_stack, is_dealer, is_small_blind, is_big_blind,
  is_turn, is_folded, current_bet, last_action, on_chain_buy_in, user_id,
  CASE 
    WHEN user_id = auth.uid() THEN cards
    ELSE '[]'::jsonb
  END as cards,
  created_at, updated_at
FROM table_seats;

GRANT SELECT ON table_seats_safe TO authenticated;
GRANT SELECT ON table_seats_safe TO anon;

-- Recreate poker_tables_safe with SECURITY INVOKER
DROP VIEW IF EXISTS poker_tables_safe;
CREATE VIEW poker_tables_safe 
WITH (security_invoker = true)
AS
SELECT 
  id, name, max_players, small_blind, big_blind, status, current_phase,
  pot, current_bet, dealer_position, active_player_seat, community_cards,
  is_private, creator_wallet, allowed_players, creation_fee_tx, creation_fee_token,
  password_protected,
  created_at, updated_at
FROM poker_tables;

GRANT SELECT ON poker_tables_safe TO authenticated;
GRANT SELECT ON poker_tables_safe TO anon;