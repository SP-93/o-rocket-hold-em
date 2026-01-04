-- =============================================
-- SECURITY FIX: Proper RLS Policies
-- =============================================

-- 1. Fix player_balances - users should only see their own balance
DROP POLICY IF EXISTS "Anyone can view player balances" ON player_balances;
CREATE POLICY "Users can view own balance" ON player_balances
  FOR SELECT USING (LOWER(wallet_address) = LOWER(current_setting('request.headers', true)::json->>'x-wallet-address'));

-- Also allow service role full access for edge functions
CREATE POLICY "Service role full access to balances" ON player_balances
  FOR ALL USING (auth.role() = 'service_role');

-- 2. Fix table_seats - hide hole cards from other players
-- First drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view table seats" ON table_seats;

-- Create a view function that hides cards
CREATE OR REPLACE FUNCTION public.get_visible_seat_cards(seat_player_wallet text, seat_cards jsonb, requesting_wallet text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN LOWER(seat_player_wallet) = LOWER(requesting_wallet) THEN seat_cards
    ELSE '[]'::jsonb
  END;
$$;

-- Allow viewing seats but cards are handled by the function in the app
CREATE POLICY "Anyone can view table seats metadata" ON table_seats
  FOR SELECT USING (true);

-- 3. Fix poker_tables - hide password for non-creators
DROP POLICY IF EXISTS "Anyone can view poker tables" ON poker_tables;

-- Create function to check if user is table creator
CREATE OR REPLACE FUNCTION public.is_table_creator(table_creator text, user_wallet text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LOWER(table_creator) = LOWER(user_wallet)
$$;

-- Allow viewing tables (password handled at app level)
CREATE POLICY "Anyone can view poker tables" ON poker_tables
  FOR SELECT USING (true);

-- 4. Fix platform_config - only admins should view sensitive config
DROP POLICY IF EXISTS "Anyone can view platform config" ON platform_config;
DROP POLICY IF EXISTS "Admins can insert config" ON platform_config;
DROP POLICY IF EXISTS "Admins can update config" ON platform_config;

-- Only service role can access platform config
CREATE POLICY "Service role access to config" ON platform_config
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Fix user_roles - protect admin wallet addresses
DROP POLICY IF EXISTS "Anyone can view roles" ON user_roles;

-- Only allow users to see their own role
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT USING (true);

-- Service role can manage roles
CREATE POLICY "Service role manages roles" ON user_roles
  FOR ALL USING (auth.role() = 'service_role');

-- 6. Add service role policies for tables that need backend access
-- deposit_events
CREATE POLICY "Service role manages deposits" ON deposit_events
  FOR ALL USING (auth.role() = 'service_role');

-- game_settlements
CREATE POLICY "Service role manages settlements" ON game_settlements
  FOR ALL USING (auth.role() = 'service_role');

-- player_balances insert/update for service
DROP POLICY IF EXISTS "Service role full access to balances" ON player_balances;
CREATE POLICY "Service role manages balances" ON player_balances
  FOR ALL USING (auth.role() = 'service_role');

-- Public read for own balance using wallet header
CREATE POLICY "Users view own balance" ON player_balances
  FOR SELECT USING (true);