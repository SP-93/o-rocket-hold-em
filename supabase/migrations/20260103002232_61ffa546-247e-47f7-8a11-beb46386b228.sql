-- Create poker_tables table
CREATE TABLE public.poker_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 6 CHECK (max_players IN (5, 6)),
  small_blind INTEGER NOT NULL DEFAULT 10,
  big_blind INTEGER NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'paused')),
  current_phase TEXT NOT NULL DEFAULT 'waiting' CHECK (current_phase IN ('waiting', 'preflop', 'flop', 'turn', 'river', 'showdown')),
  pot INTEGER NOT NULL DEFAULT 0,
  current_bet INTEGER NOT NULL DEFAULT 0,
  dealer_position INTEGER NOT NULL DEFAULT 0,
  active_player_seat INTEGER,
  community_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table_seats table
CREATE TABLE public.table_seats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.poker_tables(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL CHECK (seat_number >= 1 AND seat_number <= 6),
  player_wallet TEXT,
  player_name TEXT,
  chip_stack INTEGER NOT NULL DEFAULT 0,
  cards JSONB DEFAULT '[]'::jsonb,
  is_dealer BOOLEAN NOT NULL DEFAULT false,
  is_small_blind BOOLEAN NOT NULL DEFAULT false,
  is_big_blind BOOLEAN NOT NULL DEFAULT false,
  is_turn BOOLEAN NOT NULL DEFAULT false,
  is_folded BOOLEAN NOT NULL DEFAULT false,
  last_action TEXT CHECK (last_action IN ('fold', 'check', 'call', 'raise', 'all-in')),
  current_bet INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(table_id, seat_number)
);

-- Create game_actions table for history
CREATE TABLE public.game_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.poker_tables(id) ON DELETE CASCADE,
  player_wallet TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('fold', 'check', 'call', 'raise', 'all-in', 'join', 'leave', 'deal')),
  amount INTEGER,
  phase TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.poker_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_actions ENABLE ROW LEVEL SECURITY;

-- Public read access for poker tables (anyone can see available tables)
CREATE POLICY "Anyone can view poker tables"
  ON public.poker_tables
  FOR SELECT
  USING (true);

-- Public read access for table seats
CREATE POLICY "Anyone can view table seats"
  ON public.table_seats
  FOR SELECT
  USING (true);

-- Public read access for game actions
CREATE POLICY "Anyone can view game actions"
  ON public.game_actions
  FOR SELECT
  USING (true);

-- Public insert for joining tables (will be controlled by edge function later)
CREATE POLICY "Anyone can insert seats"
  ON public.table_seats
  FOR INSERT
  WITH CHECK (true);

-- Public update for seat actions
CREATE POLICY "Anyone can update seats"
  ON public.table_seats
  FOR UPDATE
  USING (true);

-- Public insert for game actions
CREATE POLICY "Anyone can insert game actions"
  ON public.game_actions
  FOR INSERT
  WITH CHECK (true);

-- Public insert for creating tables
CREATE POLICY "Anyone can create poker tables"
  ON public.poker_tables
  FOR INSERT
  WITH CHECK (true);

-- Public update for table state
CREATE POLICY "Anyone can update poker tables"
  ON public.poker_tables
  FOR UPDATE
  USING (true);

-- Create update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_poker_tables_updated_at
  BEFORE UPDATE ON public.poker_tables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_table_seats_updated_at
  BEFORE UPDATE ON public.table_seats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.poker_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_seats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_actions;

-- Insert demo tables
INSERT INTO public.poker_tables (name, max_players, small_blind, big_blind, status)
VALUES 
  ('Rockets Room', 6, 10, 20, 'waiting'),
  ('High Rollers', 6, 50, 100, 'waiting'),
  ('Beginners Table', 5, 5, 10, 'waiting');

-- Insert empty seats for each table
INSERT INTO public.table_seats (table_id, seat_number)
SELECT t.id, s.seat_number
FROM public.poker_tables t
CROSS JOIN generate_series(1, t.max_players) AS s(seat_number);