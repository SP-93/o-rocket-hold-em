-- Phase 1: Clean up old wallet-only data
DELETE FROM player_profiles WHERE user_id IS NULL;
DELETE FROM player_balances WHERE user_id IS NULL;
DELETE FROM user_roles;

-- Phase 2: Create trigger for new auth users (if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Phase 3: Fix RLS for public table viewing
-- Stolovi su javne informacije - dozvoljavamo čitanje
DROP POLICY IF EXISTS "Authenticated view tables" ON poker_tables;
CREATE POLICY "Public view tables" ON poker_tables
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated view seats" ON table_seats;
CREATE POLICY "Public view seats" ON table_seats
  FOR SELECT USING (true);

-- Phase 4: Migrate admin role system to use user_id
-- Add user_id column to user_roles if not exists
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create improved has_role function that works with user_id
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update RLS policies on user_roles to use user_id
DROP POLICY IF EXISTS "Service role manages roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

CREATE POLICY "Service role manages roles" ON user_roles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Update tournaments RLS to use new has_role
DROP POLICY IF EXISTS "Admins can create tournaments" ON tournaments;
CREATE POLICY "Admins can create tournaments" ON tournaments
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update tournaments" ON tournaments;
CREATE POLICY "Admins can update tournaments" ON tournaments
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Update tournament_registrations RLS
DROP POLICY IF EXISTS "Admins update registrations" ON tournament_registrations;
CREATE POLICY "Admins update registrations" ON tournament_registrations
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));