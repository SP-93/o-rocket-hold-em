-- Create table for chat messages
CREATE TABLE public.table_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.poker_tables(id) ON DELETE CASCADE,
  player_wallet TEXT NOT NULL,
  player_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.table_chat ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view chat messages"
  ON public.table_chat FOR SELECT
  USING (true);

CREATE POLICY "Anyone can send chat messages"
  ON public.table_chat FOR INSERT
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_chat;