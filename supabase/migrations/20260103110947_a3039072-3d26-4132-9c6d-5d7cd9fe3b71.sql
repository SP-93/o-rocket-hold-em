-- Create player_balances table for tracking on-chain chip balances
CREATE TABLE public.player_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    on_chain_chips BIGINT NOT NULL DEFAULT 0,
    available_chips BIGINT NOT NULL DEFAULT 0,
    locked_in_games BIGINT NOT NULL DEFAULT 0,
    total_deposited_wover BIGINT NOT NULL DEFAULT 0,
    total_withdrawn_wover BIGINT NOT NULL DEFAULT 0,
    last_sync_block BIGINT,
    last_deposit_tx TEXT,
    last_withdrawal_tx TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_balances ENABLE ROW LEVEL SECURITY;

-- Anyone can read balances (needed for game display)
CREATE POLICY "Anyone can view player balances"
ON public.player_balances
FOR SELECT
USING (true);

-- Only service role can insert/update (backend only)
-- No INSERT/UPDATE policies for anon/authenticated - only backend can modify

-- Add index for wallet lookups
CREATE INDEX idx_player_balances_wallet ON public.player_balances(wallet_address);

-- Add on_chain_buy_in column to table_seats for tracking original buy-in
ALTER TABLE public.table_seats ADD COLUMN IF NOT EXISTS on_chain_buy_in BIGINT NOT NULL DEFAULT 0;

-- Create trigger for updated_at
CREATE TRIGGER update_player_balances_updated_at
    BEFORE UPDATE ON public.player_balances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create deposit_events table for tracking blockchain events
CREATE TABLE public.deposit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    tx_hash TEXT UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    wover_amount BIGINT NOT NULL,
    chips_granted BIGINT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('deposit', 'withdrawal')),
    processed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on deposit_events
ALTER TABLE public.deposit_events ENABLE ROW LEVEL SECURITY;

-- Anyone can view deposit events
CREATE POLICY "Anyone can view deposit events"
ON public.deposit_events
FOR SELECT
USING (true);

-- Index for processing unprocessed events
CREATE INDEX idx_deposit_events_unprocessed ON public.deposit_events(processed) WHERE processed = false;
CREATE INDEX idx_deposit_events_wallet ON public.deposit_events(wallet_address);

-- Create game_settlements table for audit trail
CREATE TABLE public.game_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID REFERENCES public.poker_tables(id) NOT NULL,
    settlement_data JSONB NOT NULL,
    tx_hash TEXT,
    settled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_settlements ENABLE ROW LEVEL SECURITY;

-- Anyone can view settlements
CREATE POLICY "Anyone can view game settlements"
ON public.game_settlements
FOR SELECT
USING (true);