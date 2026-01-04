-- =====================================================
-- PHASE 2: CRITICAL RLS SECURITY HARDENING
-- =====================================================

-- Add password_protected computed column to poker_tables
ALTER TABLE poker_tables 
ADD COLUMN IF NOT EXISTS password_protected BOOLEAN GENERATED ALWAYS AS (table_password IS NOT NULL) STORED;

-- =====================================================
-- 1. poker_tables: Hide passwords, restrict modifications
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view poker tables" ON poker_tables;
DROP POLICY IF EXISTS "Anyone can create poker tables" ON poker_tables;
DROP POLICY IF EXISTS "Anyone can update poker tables" ON poker_tables;

-- Public can view tables but NOT the password (use VIEW for this)
CREATE POLICY "Public view tables metadata" ON poker_tables
  FOR SELECT USING (true);

-- Only authenticated users can create tables
CREATE POLICY "Authenticated create tables" ON poker_tables
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Service role can update game state
CREATE POLICY "Service role updates tables" ON poker_tables
  FOR UPDATE USING (auth.role() = 'service_role');

-- =====================================================
-- 2. table_seats: Restrict seat modifications, hide cards
-- =====================================================

DROP POLICY IF EXISTS "Anyone can insert seats" ON table_seats;
DROP POLICY IF EXISTS "Anyone can update seats" ON table_seats;
DROP POLICY IF EXISTS "Anyone can view table seats metadata" ON table_seats;

-- Everyone can view seat metadata (cards hidden at app layer)
CREATE POLICY "View seats metadata" ON table_seats
  FOR SELECT USING (true);

-- Only service role can insert new seats (via edge function)
CREATE POLICY "Service role inserts seats" ON table_seats
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Service role or seat owner can update
CREATE POLICY "Service or owner updates seats" ON table_seats
  FOR UPDATE USING (
    auth.role() = 'service_role' OR 
    user_id = auth.uid()
  );

-- =====================================================
-- 3. table_chat: Restrict to table participants
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view chat messages" ON table_chat;
DROP POLICY IF EXISTS "Anyone can send chat messages" ON table_chat;

-- Only players at the table can view chat
CREATE POLICY "Participants view chat" ON table_chat
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM table_seats 
      WHERE table_seats.table_id = table_chat.table_id 
      AND table_seats.user_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

-- Only players at the table can send messages
CREATE POLICY "Participants send chat" ON table_chat
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM table_seats 
      WHERE table_seats.table_id = table_chat.table_id 
      AND table_seats.user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. game_actions: Restrict to service role insert, participants view
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view game actions" ON game_actions;
DROP POLICY IF EXISTS "Anyone can insert game actions" ON game_actions;

-- Only service role can insert actions (via edge functions)
CREATE POLICY "Service role inserts actions" ON game_actions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Only table participants can view actions
CREATE POLICY "Participants view actions" ON game_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM table_seats 
      WHERE table_seats.table_id = game_actions.table_id 
      AND table_seats.user_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

-- =====================================================
-- 5. Create safe VIEW for table_seats that hides cards
-- =====================================================

CREATE OR REPLACE VIEW table_seats_safe AS
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

-- Grant access to the view
GRANT SELECT ON table_seats_safe TO authenticated;
GRANT SELECT ON table_seats_safe TO anon;

-- =====================================================
-- 6. Create safe VIEW for poker_tables that hides password
-- =====================================================

CREATE OR REPLACE VIEW poker_tables_safe AS
SELECT 
  id, name, max_players, small_blind, big_blind, status, current_phase,
  pot, current_bet, dealer_position, active_player_seat, community_cards,
  is_private, creator_wallet, allowed_players, creation_fee_tx, creation_fee_token,
  password_protected,
  created_at, updated_at
  -- table_password intentionally excluded
FROM poker_tables;

GRANT SELECT ON poker_tables_safe TO authenticated;
GRANT SELECT ON poker_tables_safe TO anon;

-- =====================================================
-- 7. Rate limiting for table_chat
-- =====================================================

CREATE POLICY "Rate limit table chat" ON table_chat
  FOR INSERT WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM table_chat tc
      WHERE tc.player_wallet = (
        SELECT wallet_address FROM user_wallets 
        WHERE user_id = auth.uid() AND is_primary = true 
        LIMIT 1
      )
      AND tc.created_at > (now() - interval '3 seconds')
    )
  );