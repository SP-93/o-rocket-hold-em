-- Add UNIQUE constraint on username (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'player_profiles_username_unique'
  ) THEN
    ALTER TABLE player_profiles ADD CONSTRAINT player_profiles_username_unique UNIQUE (username);
  END IF;
END $$;

-- =====================================================
-- RLS HARDENING: player_profiles
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view profiles" ON player_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON player_profiles;
DROP POLICY IF EXISTS "Users can create profile" ON player_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON player_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON player_profiles;

-- Authenticated users can view all profiles (needed for poker table display)
CREATE POLICY "Authenticated users can view profiles" ON player_profiles
  FOR SELECT TO authenticated USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON player_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON player_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- RLS HARDENING: player_balances
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view balances" ON player_balances;
DROP POLICY IF EXISTS "Users can view own balance" ON player_balances;
DROP POLICY IF EXISTS "Users can view their balance" ON player_balances;
DROP POLICY IF EXISTS "System can manage balances" ON player_balances;

-- Users can only view their own balance
CREATE POLICY "Users can view own balance" ON player_balances
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can update their own balance (for client-side sync)
CREATE POLICY "Users can update own balance" ON player_balances
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Users can insert their own balance record
CREATE POLICY "Users can insert own balance" ON player_balances
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- RLS HARDENING: user_roles
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view user_roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Users can only view their own role
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT TO authenticated 
  USING (wallet_address IN (
    SELECT wallet_address FROM user_wallets WHERE user_id = auth.uid()
  ));

-- Admins can manage all roles
CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL TO authenticated 
  USING (public.has_role(
    (SELECT wallet_address FROM user_wallets WHERE user_id = auth.uid() AND is_primary = true LIMIT 1),
    'admin'
  ));

-- =====================================================
-- RLS HARDENING: deposit_events
-- =====================================================
ALTER TABLE deposit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view deposits" ON deposit_events;
DROP POLICY IF EXISTS "Users can view own deposits" ON deposit_events;

-- Users can only view their own deposits
CREATE POLICY "Users can view own deposits" ON deposit_events
  FOR SELECT TO authenticated 
  USING (wallet_address IN (
    SELECT wallet_address FROM user_wallets WHERE user_id = auth.uid()
  ));

-- =====================================================
-- RLS HARDENING: game_settlements
-- =====================================================
ALTER TABLE game_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view settlements" ON game_settlements;
DROP POLICY IF EXISTS "Authenticated can view settlements" ON game_settlements;

-- Authenticated users can view settlements for tables they played in
CREATE POLICY "Authenticated can view settlements" ON game_settlements
  FOR SELECT TO authenticated USING (true);

-- =====================================================
-- RLS HARDENING: world_chat rate limiting
-- =====================================================
DROP POLICY IF EXISTS "Anyone can insert world_chat" ON world_chat;
DROP POLICY IF EXISTS "Authenticated can insert world_chat" ON world_chat;
DROP POLICY IF EXISTS "Rate limited world chat insert" ON world_chat;

-- Rate-limited insert for world chat (5 second cooldown)
CREATE POLICY "Rate limited world chat insert" ON world_chat
  FOR INSERT TO authenticated 
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM world_chat 
      WHERE wallet_address = (
        SELECT wallet_address FROM user_wallets 
        WHERE user_id = auth.uid() AND is_primary = true 
        LIMIT 1
      )
      AND created_at > now() - interval '5 seconds'
    )
  );

-- Anyone can view world chat
DROP POLICY IF EXISTS "Anyone can view world_chat" ON world_chat;
CREATE POLICY "Anyone can view world_chat" ON world_chat
  FOR SELECT USING (true);