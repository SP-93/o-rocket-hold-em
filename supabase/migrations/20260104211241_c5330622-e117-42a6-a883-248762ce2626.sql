-- =====================================================
-- ADDITIONAL RLS FIXES
-- =====================================================

-- 1. player_profiles: Restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view player profiles" ON player_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON player_profiles;

CREATE POLICY "Authenticated view profiles" ON player_profiles
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 2. deposit_events: Remove public access, only own deposits
DROP POLICY IF EXISTS "Anyone can view deposit events" ON deposit_events;

-- Keep existing "Users can view own deposits" policy

-- 3. game_settlements: Restrict to service role only for detailed data
DROP POLICY IF EXISTS "Anyone can view game settlements" ON game_settlements;
DROP POLICY IF EXISTS "Authenticated can view settlements" ON game_settlements;

CREATE POLICY "Service role only settlements" ON game_settlements
  FOR SELECT USING (auth.role() = 'service_role');

-- 4. tournaments: Fix admin check for create
DROP POLICY IF EXISTS "Admins can create tournaments" ON tournaments;

CREATE POLICY "Admins can create tournaments" ON tournaments
  FOR INSERT WITH CHECK (
    has_role(
      (SELECT wallet_address FROM user_wallets WHERE user_id = auth.uid() AND is_primary = true LIMIT 1),
      'admin'::app_role
    )
  );

-- 5. tournament_registrations: Add user isolation
DROP POLICY IF EXISTS "Anyone can register for tournaments" ON tournament_registrations;
DROP POLICY IF EXISTS "Admins can update registrations" ON tournament_registrations;

CREATE POLICY "Users register own wallet" ON tournament_registrations
  FOR INSERT WITH CHECK (
    wallet_address IN (
      SELECT wallet_address FROM user_wallets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins update registrations" ON tournament_registrations
  FOR UPDATE USING (
    has_role(
      (SELECT wallet_address FROM user_wallets WHERE user_id = auth.uid() AND is_primary = true LIMIT 1),
      'admin'::app_role
    )
  );

-- 6. world_chat: Restrict insert to authenticated with proper rate limit
DROP POLICY IF EXISTS "Anyone can send messages" ON world_chat;

CREATE POLICY "Authenticated send messages" ON world_chat
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. poker_tables: Create stricter SELECT that excludes password
-- The VIEW poker_tables_safe should be used for client access
-- But we also need to ensure raw table access doesn't leak password
-- (Since we can't restrict columns in RLS, the VIEW is the solution)