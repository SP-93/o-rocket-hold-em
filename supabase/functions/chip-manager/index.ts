import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Constants matching smart contract
const CHIPS_PER_WOVER = 100;

interface ActionRequest {
  action: 'get_balance' | 'verify_deposit' | 'join_table' | 'leave_table' | 'process_settlement' | 'sync_balance';
  wallet_address?: string;
  table_id?: string;
  chip_amount?: number;
  tx_hash?: string;
  block_number?: number;
  wover_amount?: number;
  event_type?: 'deposit' | 'withdrawal';
  settlement_data?: {
    players: { wallet: string; final_chips: number }[];
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role for backend operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body: ActionRequest = await req.json();
    const { action, wallet_address } = body;

    console.log(`[chip-manager] Action: ${action}, Wallet: ${wallet_address}`);

    switch (action) {
      case 'get_balance': {
        if (!wallet_address) {
          return errorResponse('wallet_address required', 400);
        }

        // Get or create player balance
        let { data: balance, error } = await supabase
          .from('player_balances')
          .select('*')
          .eq('wallet_address', wallet_address.toLowerCase())
          .single();

        if (error && error.code === 'PGRST116') {
          // Create new balance record
          const { data: newBalance, error: insertError } = await supabase
            .from('player_balances')
            .insert({ wallet_address: wallet_address.toLowerCase() })
            .select()
            .single();

          if (insertError) {
            console.error('[chip-manager] Insert error:', insertError);
            return errorResponse('Failed to create balance', 500);
          }
          balance = newBalance;
        } else if (error) {
          console.error('[chip-manager] Get balance error:', error);
          return errorResponse('Failed to get balance', 500);
        }

        return successResponse({ balance });
      }

      case 'verify_deposit': {
        const { tx_hash, block_number, wover_amount, event_type } = body;
        
        if (!wallet_address || !tx_hash || !block_number || !wover_amount || !event_type) {
          return errorResponse('Missing required fields for verify_deposit', 400);
        }

        // Check if event already processed
        const { data: existing } = await supabase
          .from('deposit_events')
          .select('id')
          .eq('tx_hash', tx_hash)
          .single();

        if (existing) {
          return errorResponse('Event already processed', 409);
        }

        const chips_granted = event_type === 'deposit' 
          ? wover_amount * CHIPS_PER_WOVER 
          : -(wover_amount * CHIPS_PER_WOVER);

        // Record the event
        const { error: eventError } = await supabase
          .from('deposit_events')
          .insert({
            wallet_address: wallet_address.toLowerCase(),
            tx_hash,
            block_number,
            wover_amount,
            chips_granted: Math.abs(chips_granted),
            event_type,
            processed: true,
          });

        if (eventError) {
          console.error('[chip-manager] Event insert error:', eventError);
          return errorResponse('Failed to record event', 500);
        }

        // Update player balance
        const { data: currentBalance } = await supabase
          .from('player_balances')
          .select('*')
          .eq('wallet_address', wallet_address.toLowerCase())
          .single();

        if (currentBalance) {
          const updates = event_type === 'deposit' 
            ? {
                on_chain_chips: currentBalance.on_chain_chips + chips_granted,
                available_chips: currentBalance.available_chips + chips_granted,
                total_deposited_wover: currentBalance.total_deposited_wover + wover_amount,
                last_sync_block: block_number,
                last_deposit_tx: tx_hash,
              }
            : {
                on_chain_chips: currentBalance.on_chain_chips + chips_granted,
                available_chips: currentBalance.available_chips + chips_granted,
                total_withdrawn_wover: currentBalance.total_withdrawn_wover + wover_amount,
                last_sync_block: block_number,
                last_withdrawal_tx: tx_hash,
              };

          const { error: updateError } = await supabase
            .from('player_balances')
            .update(updates)
            .eq('wallet_address', wallet_address.toLowerCase());

          if (updateError) {
            console.error('[chip-manager] Balance update error:', updateError);
            return errorResponse('Failed to update balance', 500);
          }
        } else {
          // Create new balance
          const { error: insertError } = await supabase
            .from('player_balances')
            .insert({
              wallet_address: wallet_address.toLowerCase(),
              on_chain_chips: chips_granted,
              available_chips: event_type === 'deposit' ? chips_granted : 0,
              total_deposited_wover: event_type === 'deposit' ? wover_amount : 0,
              last_sync_block: block_number,
              last_deposit_tx: event_type === 'deposit' ? tx_hash : null,
            });

          if (insertError) {
            console.error('[chip-manager] Insert error:', insertError);
            return errorResponse('Failed to create balance', 500);
          }
        }

        console.log(`[chip-manager] Verified ${event_type}: ${wover_amount} WOVER = ${Math.abs(chips_granted)} chips for ${wallet_address}`);
        return successResponse({ success: true, chips_granted: Math.abs(chips_granted) });
      }

      case 'join_table': {
        const { table_id, chip_amount } = body;

        if (!wallet_address || !table_id || !chip_amount) {
          return errorResponse('Missing required fields for join_table', 400);
        }

        // Get current balance
        const { data: balance, error: balanceError } = await supabase
          .from('player_balances')
          .select('*')
          .eq('wallet_address', wallet_address.toLowerCase())
          .single();

        if (balanceError || !balance) {
          return errorResponse('Player balance not found', 404);
        }

        if (balance.available_chips < chip_amount) {
          return errorResponse(`Insufficient chips. Available: ${balance.available_chips}, Required: ${chip_amount}`, 400);
        }

        // Lock chips (move from available to locked)
        const { error: updateError } = await supabase
          .from('player_balances')
          .update({
            available_chips: balance.available_chips - chip_amount,
            locked_in_games: balance.locked_in_games + chip_amount,
          })
          .eq('wallet_address', wallet_address.toLowerCase());

        if (updateError) {
          console.error('[chip-manager] Lock chips error:', updateError);
          return errorResponse('Failed to lock chips', 500);
        }

        console.log(`[chip-manager] Locked ${chip_amount} chips for ${wallet_address} at table ${table_id}`);
        return successResponse({ 
          success: true, 
          locked_chips: chip_amount,
          remaining_available: balance.available_chips - chip_amount,
        });
      }

      case 'leave_table': {
        const { table_id, chip_amount } = body;

        if (!wallet_address || !table_id || chip_amount === undefined) {
          return errorResponse('Missing required fields for leave_table', 400);
        }

        // Get current balance
        const { data: balance, error: balanceError } = await supabase
          .from('player_balances')
          .select('*')
          .eq('wallet_address', wallet_address.toLowerCase())
          .single();

        if (balanceError || !balance) {
          return errorResponse('Player balance not found', 404);
        }

        // Get original buy-in from seat
        const { data: seat } = await supabase
          .from('table_seats')
          .select('on_chain_buy_in')
          .eq('table_id', table_id)
          .eq('player_wallet', wallet_address.toLowerCase())
          .single();

        const originalBuyIn = seat?.on_chain_buy_in || chip_amount;

        // Unlock chips (move from locked to available with new amount)
        const chipDifference = chip_amount - originalBuyIn;
        
        const { error: updateError } = await supabase
          .from('player_balances')
          .update({
            available_chips: balance.available_chips + chip_amount,
            locked_in_games: Math.max(0, balance.locked_in_games - originalBuyIn),
            on_chain_chips: balance.on_chain_chips + chipDifference,
          })
          .eq('wallet_address', wallet_address.toLowerCase());

        if (updateError) {
          console.error('[chip-manager] Unlock chips error:', updateError);
          return errorResponse('Failed to unlock chips', 500);
        }

        console.log(`[chip-manager] Unlocked ${chip_amount} chips for ${wallet_address} (original: ${originalBuyIn})`);
        return successResponse({ 
          success: true, 
          final_chips: chip_amount,
          profit: chipDifference,
        });
      }

      case 'process_settlement': {
        const { table_id, settlement_data } = body;

        if (!table_id || !settlement_data?.players) {
          return errorResponse('Missing required fields for process_settlement', 400);
        }

        console.log(`[chip-manager] Processing settlement for table ${table_id}`);

        // Process each player's final chips
        for (const player of settlement_data.players) {
          const { wallet, final_chips } = player;
          
          // Get current balance and original buy-in
          const { data: balance } = await supabase
            .from('player_balances')
            .select('*')
            .eq('wallet_address', wallet.toLowerCase())
            .single();

          const { data: seat } = await supabase
            .from('table_seats')
            .select('on_chain_buy_in, chip_stack')
            .eq('table_id', table_id)
            .eq('player_wallet', wallet.toLowerCase())
            .single();

          if (balance && seat) {
            const originalBuyIn = seat.on_chain_buy_in;
            const chipDifference = final_chips - originalBuyIn;

            await supabase
              .from('player_balances')
              .update({
                available_chips: balance.available_chips + final_chips,
                locked_in_games: Math.max(0, balance.locked_in_games - originalBuyIn),
                on_chain_chips: balance.on_chain_chips + chipDifference,
              })
              .eq('wallet_address', wallet.toLowerCase());

            console.log(`[chip-manager] Settled ${wallet}: ${final_chips} chips (profit: ${chipDifference})`);
          }
        }

        // Record settlement
        await supabase
          .from('game_settlements')
          .insert({
            table_id,
            settlement_data,
          });

        return successResponse({ success: true });
      }

      case 'sync_balance': {
        if (!wallet_address) {
          return errorResponse('wallet_address required', 400);
        }

        // This would be called with on-chain data to sync
        // For now, just return current balance
        const { data: balance } = await supabase
          .from('player_balances')
          .select('*')
          .eq('wallet_address', wallet_address.toLowerCase())
          .single();

        return successResponse({ balance, synced: true });
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }

  } catch (error: unknown) {
    console.error('[chip-manager] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});

function successResponse(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
