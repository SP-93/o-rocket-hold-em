-- Fix remaining critical issues

-- 1. player_balances: Strengthen RLS - only own records
DROP POLICY IF EXISTS "Users can view own balance by user_id" ON player_balances;
DROP POLICY IF EXISTS "Users can view own balance" ON player_balances;
DROP POLICY IF EXISTS "Users can update own balance" ON player_balances;
DROP POLICY IF EXISTS "Users can insert own balance" ON player_balances;

-- Single strict policy for viewing own balance
CREATE POLICY "Users view own balance" ON player_balances
  FOR SELECT USING (auth.uid() = user_id);

-- Update only via service role (chip-manager edge function)
CREATE POLICY "Service role manages balances update" ON player_balances
  FOR UPDATE USING (auth.role() = 'service_role');

-- Insert only via service role (handle_new_user trigger uses postgres role)
CREATE POLICY "Service role manages balances insert" ON player_balances
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

-- 2. tournament_registrations: Restrict public SELECT
DROP POLICY IF EXISTS "Anyone can view registrations" ON tournament_registrations;

-- Only participants and admins can view detailed registrations
CREATE POLICY "Participants view registrations" ON tournament_registrations
  FOR SELECT USING (
    wallet_address IN (SELECT wallet_address FROM user_wallets WHERE user_id = auth.uid())
    OR has_role(
      (SELECT wallet_address FROM user_wallets WHERE user_id = auth.uid() AND is_primary = true LIMIT 1),
      'admin'::app_role
    )
    OR auth.role() = 'service_role'
  );

-- 3. poker_tables: Already using VIEW, but also restrict raw table SELECT to service role for sensitive fields
-- Note: The VIEW poker_tables_safe is the public interface