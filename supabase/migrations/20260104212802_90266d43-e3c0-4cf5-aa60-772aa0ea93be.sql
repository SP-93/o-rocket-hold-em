-- Fix remaining security issues

-- 1. player_profiles: Remove insecure "anyone can insert" policy
DROP POLICY IF EXISTS "Anyone can insert their own profile" ON player_profiles;

-- 2. table_seats: Since we use table_seats_safe VIEW for client access,
-- restrict raw table SELECT to service role only
DROP POLICY IF EXISTS "View seats metadata" ON table_seats;

CREATE POLICY "Authenticated view seats" ON table_seats
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 3. poker_tables: Restrict raw table SELECT to service role
-- Frontend uses poker_tables_safe VIEW
DROP POLICY IF EXISTS "Public view tables metadata" ON poker_tables;

CREATE POLICY "Authenticated view tables" ON poker_tables
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');