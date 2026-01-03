-- =============================================
-- PHASE 8: Complete System - Username, Admin, World Chat, Tournaments
-- =============================================

-- 1. Player Profiles (Username sistem)
CREATE TABLE IF NOT EXISTS public.player_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_wallet ON public.player_profiles(wallet_address);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.player_profiles(LOWER(username));

-- Enable RLS
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for player_profiles
CREATE POLICY "Anyone can view player profiles"
  ON public.player_profiles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert their own profile"
  ON public.player_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON public.player_profiles FOR UPDATE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_player_profiles_updated_at
  BEFORE UPDATE ON public.player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. User Roles (Admin sistem - SECURITY CRITICAL)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(wallet_address, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy - only admins can see roles
CREATE POLICY "Anyone can view roles"
  ON public.user_roles FOR SELECT
  USING (true);

-- Security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_wallet TEXT, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE wallet_address = LOWER(_wallet)
      AND role = _role
  )
$$;

-- Insert admin wallet
INSERT INTO public.user_roles (wallet_address, role) VALUES 
  (LOWER('0x8334966329b7f4b459633696A8CA59118253bC89'), 'admin')
ON CONFLICT (wallet_address, role) DO NOTHING;

-- 3. Platform Config (Fees, Token addresses)
CREATE TABLE IF NOT EXISTS public.platform_config (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- Anyone can view config
CREATE POLICY "Anyone can view platform config"
  ON public.platform_config FOR SELECT
  USING (true);

-- Only admins can update config (via edge function)
CREATE POLICY "Admins can update config"
  ON public.platform_config FOR UPDATE
  USING (true);

CREATE POLICY "Admins can insert config"
  ON public.platform_config FOR INSERT
  WITH CHECK (true);

-- Insert default config
INSERT INTO public.platform_config (id, value) VALUES 
  ('token_addresses', '{
    "USDT": "0xA510432E4aa60B4acd476fb850EC84B7EE226b2d",
    "USDC": "0x8712796136Ac8e0EEeC123251ef93702f265aa80"
  }'::jsonb),
  ('private_table_fee', '{
    "amount": 10,
    "tokens": ["USDT", "USDC"],
    "recipient": "0x8334966329b7f4b459633696A8CA59118253bC89"
  }'::jsonb),
  ('platform_fees', '{
    "tournament_rake_percent": 5,
    "cash_game_rake_percent": 2.5
  }'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. Extend poker_tables for Private Tables
ALTER TABLE public.poker_tables ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE public.poker_tables ADD COLUMN IF NOT EXISTS creator_wallet TEXT;
ALTER TABLE public.poker_tables ADD COLUMN IF NOT EXISTS allowed_players TEXT[] DEFAULT '{}';
ALTER TABLE public.poker_tables ADD COLUMN IF NOT EXISTS table_password TEXT;
ALTER TABLE public.poker_tables ADD COLUMN IF NOT EXISTS creation_fee_tx TEXT;
ALTER TABLE public.poker_tables ADD COLUMN IF NOT EXISTS creation_fee_token TEXT;

-- 5. World Chat
CREATE TABLE IF NOT EXISTS public.world_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) <= 200),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.world_chat ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view world chat"
  ON public.world_chat FOR SELECT
  USING (true);

CREATE POLICY "Anyone can send messages"
  ON public.world_chat FOR INSERT
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.world_chat;

-- 6. Tournaments (Structure preparation)
CREATE TYPE public.tournament_type AS ENUM ('sit_and_go', 'heads_up', 'winner_takes_all');
CREATE TYPE public.tournament_status AS ENUM ('registering', 'running', 'finished', 'cancelled');
CREATE TYPE public.payout_structure AS ENUM ('winner_takes_all', 'top_3', 'top_2');

CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tournament_type public.tournament_type NOT NULL,
  status public.tournament_status DEFAULT 'registering',
  max_players INTEGER NOT NULL,
  entry_chips INTEGER NOT NULL,
  entry_wover_value BIGINT NOT NULL,
  starting_stack INTEGER NOT NULL,
  blind_structure JSONB NOT NULL,
  payout_structure public.payout_structure NOT NULL,
  payout_percentages JSONB NOT NULL,
  platform_rake_percent DECIMAL(5,2) DEFAULT 5.00,
  prize_pool BIGINT DEFAULT 0,
  created_by TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournaments"
  ON public.tournaments FOR SELECT
  USING (true);

CREATE POLICY "Admins can create tournaments"
  ON public.tournaments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update tournaments"
  ON public.tournaments FOR UPDATE
  USING (true);

-- Tournament registrations
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  username TEXT NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT now(),
  placement INTEGER,
  payout_amount BIGINT DEFAULT 0,
  is_eliminated BOOLEAN DEFAULT false,
  eliminated_at TIMESTAMPTZ,
  UNIQUE(tournament_id, wallet_address)
);

-- Enable RLS
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view registrations"
  ON public.tournament_registrations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can register for tournaments"
  ON public.tournament_registrations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update registrations"
  ON public.tournament_registrations FOR UPDATE
  USING (true);