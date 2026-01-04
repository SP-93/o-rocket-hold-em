-- Create user_wallets table for linking wallets to auth users
CREATE TABLE public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wallet_address TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  label TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(wallet_address)
);

-- Indexes for fast lookups
CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX idx_user_wallets_address ON user_wallets(wallet_address);

-- Enable RLS
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_wallets
CREATE POLICY "Users can view own wallets" ON user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets" ON user_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets" ON user_wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallets" ON user_wallets
  FOR DELETE USING (auth.uid() = user_id);

-- Add user_id column to player_profiles
ALTER TABLE player_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_player_profiles_user_id ON player_profiles(user_id);

-- Add user_id column to player_balances
ALTER TABLE player_balances ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_player_balances_user_id ON player_balances(user_id);

-- Add user_id column to table_seats
ALTER TABLE table_seats ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_table_seats_user_id ON table_seats(user_id);

-- Add user_id column to game_actions
ALTER TABLE game_actions ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_game_actions_user_id ON game_actions(user_id);

-- Update RLS policy for player_balances to use user_id
DROP POLICY IF EXISTS "Users can view own balance" ON player_balances;
DROP POLICY IF EXISTS "Users view own balance" ON player_balances;

CREATE POLICY "Users can view own balance by user_id" ON player_balances
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Update RLS policy for player_profiles to use user_id
DROP POLICY IF EXISTS "Users can update their own profile" ON player_profiles;

CREATE POLICY "Users can update own profile by user_id" ON player_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to ensure only one primary wallet per user
CREATE OR REPLACE FUNCTION public.ensure_single_primary_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE user_wallets 
    SET is_primary = false 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for primary wallet management
CREATE TRIGGER trigger_ensure_single_primary_wallet
  AFTER INSERT OR UPDATE ON user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_wallet();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.player_profiles (user_id, wallet_address, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'wallet_address', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', 'Player_' || substr(NEW.id::text, 1, 8))
  );
  
  INSERT INTO public.player_balances (user_id, wallet_address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'wallet_address', '')
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Enable realtime for user_wallets
ALTER PUBLICATION supabase_realtime ADD TABLE user_wallets;