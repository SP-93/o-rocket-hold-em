import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 1 WOVER = 1 CHIP (with 18 decimal precision)
const CHIPS_PER_WOVER = 1;

// Admin wallet - owner of smart contract (for verification and logging)
const ADMIN_WALLET_ADDRESS = '0x8334966329b7f4b459633696A8CA59118253bC89';

interface ActionRequest {
  action: 'get_balance' | 'verify_deposit' | 'join_table' | 'leave_table' | 'process_settlement' | 'sync_balance' | 'request_payout' | 'admin_process_payout';
  wallet_address?: string;
  user_id?: string;
  table_id?: string;
  chip_amount?: number;
  tx_hash?: string;
  block_number?: number;
  wover_amount?: number;
  event_type?: 'deposit' | 'withdrawal';
  settlement_data?: {
    players: { wallet: string; user_id: string; final_chips: number }[];
  };
}

// Helper to extract user from JWT token
async function getUserFromRequest(req: Request, supabase: any): Promise<{ user: any; error: string | null }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { user: null, error: 'Invalid or expired token' };
  }

  return { user, error: null };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Use anon key for auth verification, service role for DB operations
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body: ActionRequest = await req.json();
    const { action, wallet_address } = body;

    console.log(`[chip-manager] Action: ${action}, Wallet: ${wallet_address}`);

    // Actions that require authentication
    const authRequiredActions = ['join_table', 'leave_table', 'request_payout'];
    
    let currentUser = null;
    if (authRequiredActions.includes(action)) {
      const { user, error } = await getUserFromRequest(req, supabaseAuth);
      if (error) {
        console.log(`[chip-manager] Auth failed for ${action}: ${error}`);
        return errorResponse(error, 401);
      }
      currentUser = user;
      console.log(`[chip-manager] Authenticated user: ${currentUser.id} for action: ${action}`);
    }

    switch (action) {
      case 'get_balance': {
        // Can be called with wallet_address OR user_id (from auth)
        let userId = body.user_id;
        
        // Try to get user from auth header if not provided
        if (!userId) {
          const { user } = await getUserFromRequest(req, supabaseAuth);
          userId = user?.id;
        }

        if (!userId && !wallet_address) {
          return errorResponse('user_id or wallet_address required', 400);
        }

        // Get balance by user_id first, fallback to wallet_address
        let balance;
        if (userId) {
          const { data, error } = await supabase
            .from('player_balances')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (!error) {
            balance = data;
          }
        }
        
        // Fallback to wallet address (for backwards compatibility)
        if (!balance && wallet_address) {
          const { data, error } = await supabase
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
          } else {
            balance = data;
          }
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

        // 1 WOVER = 1 CHIP (direct 1:1 conversion)
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

        // Find user by wallet address
        const { data: userWallet } = await supabase
          .from('user_wallets')
          .select('user_id')
          .eq('wallet_address', wallet_address.toLowerCase())
          .single();

        // Update player balance by user_id if found, otherwise by wallet_address
        const filterColumn = userWallet?.user_id ? 'user_id' : 'wallet_address';
        const filterValue = userWallet?.user_id || wallet_address.toLowerCase();

        const { data: currentBalance } = await supabase
          .from('player_balances')
          .select('*')
          .eq(filterColumn, filterValue)
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
            .eq(filterColumn, filterValue);

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
              user_id: userWallet?.user_id || null,
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
        // SECURITY: Use authenticated user's ID
        const table_id = body.table_id || (body as any).tableId;
        const chip_amount = body.chip_amount || (body as any).amount;

        console.log(`[chip-manager] join_table request:`, { table_id, chip_amount, user_id: currentUser.id });

        if (!table_id || !chip_amount) {
          return errorResponse('Missing required fields for join_table (tableId, amount)', 400);
        }

        // Get player balance by user_id
        const { data: balance, error: balanceError } = await supabase
          .from('player_balances')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (balanceError || !balance) {
          console.error('[chip-manager] Balance not found for user:', currentUser.id);
          return errorResponse('Player balance not found. Please buy chips first.', 404);
        }

        if (balance.available_chips < chip_amount) {
          return errorResponse(`Insufficient chips. Available: ${balance.available_chips}, Required: ${chip_amount}. Please buy chips first.`, 400);
        }

        // Lock chips (move from available to locked)
        const { error: updateError } = await supabase
          .from('player_balances')
          .update({
            available_chips: balance.available_chips - chip_amount,
            locked_in_games: balance.locked_in_games + chip_amount,
          })
          .eq('user_id', currentUser.id);

        if (updateError) {
          console.error('[chip-manager] Lock chips error:', updateError);
          return errorResponse('Failed to lock chips', 500);
        }

        console.log(`[chip-manager] Locked ${chip_amount} chips for user ${currentUser.id} at table ${table_id}`);
        return successResponse({ 
          success: true, 
          locked_chips: chip_amount,
          remaining_available: balance.available_chips - chip_amount,
        });
      }

      case 'leave_table': {
        const { table_id, chip_amount } = body;

        if (!table_id || chip_amount === undefined) {
          return errorResponse('Missing required fields for leave_table', 400);
        }

        // Get balance by user_id
        const { data: balance, error: balanceError } = await supabase
          .from('player_balances')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (balanceError || !balance) {
          return errorResponse('Player balance not found', 404);
        }

        // Get original buy-in from seat
        const { data: seat } = await supabase
          .from('table_seats')
          .select('on_chain_buy_in')
          .eq('table_id', table_id)
          .eq('user_id', currentUser.id)
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
          .eq('user_id', currentUser.id);

        if (updateError) {
          console.error('[chip-manager] Unlock chips error:', updateError);
          return errorResponse('Failed to unlock chips', 500);
        }

        console.log(`[chip-manager] Unlocked ${chip_amount} chips for user ${currentUser.id} (original: ${originalBuyIn})`);
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
          const { wallet, user_id, final_chips } = player;
          
          // Prefer user_id, fallback to wallet
          const filterColumn = user_id ? 'user_id' : 'wallet_address';
          const filterValue = user_id || wallet.toLowerCase();

          const { data: balance } = await supabase
            .from('player_balances')
            .select('*')
            .eq(filterColumn, filterValue)
            .single();

          const { data: seat } = await supabase
            .from('table_seats')
            .select('on_chain_buy_in, chip_stack')
            .eq('table_id', table_id)
            .eq(user_id ? 'user_id' : 'player_wallet', filterValue)
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
              .eq(filterColumn, filterValue);

            console.log(`[chip-manager] Settled ${user_id || wallet}: ${final_chips} chips (profit: ${chipDifference})`);
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

        // Get balance, prefer by user if authenticated
        const { user } = await getUserFromRequest(req, supabaseAuth);
        
        const filterColumn = user?.id ? 'user_id' : 'wallet_address';
        const filterValue = user?.id || wallet_address.toLowerCase();

        const { data: balance } = await supabase
          .from('player_balances')
          .select('*')
          .eq(filterColumn, filterValue)
          .single();

        return successResponse({ balance, synced: true });
      }

      case 'request_payout': {
        const { chip_amount } = body;

        if (!chip_amount || chip_amount <= 0) {
          return errorResponse('Valid chip_amount required', 400);
        }

        // Get balance by user_id
        const { data: balance, error: balanceError } = await supabase
          .from('player_balances')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (balanceError || !balance) {
          return errorResponse('Player balance not found', 404);
        }

        if (balance.available_chips < chip_amount) {
          return errorResponse(`Insufficient chips. Available: ${balance.available_chips}, Requested: ${chip_amount}`, 400);
        }

        // Get user's primary wallet for payout
        const { data: primaryWallet } = await supabase
          .from('user_wallets')
          .select('wallet_address')
          .eq('user_id', currentUser.id)
          .eq('is_primary', true)
          .single();

        if (!primaryWallet) {
          return errorResponse('No primary wallet configured. Please link a wallet first.', 400);
        }

        // 1 CHIP = 1 WOVER
        const wover_amount = chip_amount / CHIPS_PER_WOVER;

        // Deduct chips from balance
        const { error: updateError } = await supabase
          .from('player_balances')
          .update({
            available_chips: balance.available_chips - chip_amount,
            on_chain_chips: balance.on_chain_chips - chip_amount,
          })
          .eq('user_id', currentUser.id);

        if (updateError) {
          console.error('[chip-manager] Payout deduction error:', updateError);
          return errorResponse('Failed to process payout request', 500);
        }

        // Record the pending payout event
        const { error: eventError } = await supabase
          .from('deposit_events')
          .insert({
            wallet_address: primaryWallet.wallet_address,
            tx_hash: `pending_${Date.now()}_${currentUser.id.slice(0, 8)}`,
            block_number: 0,
            wover_amount,
            chips_granted: chip_amount,
            event_type: 'withdrawal_pending',
            processed: false,
          });

        if (eventError) {
          console.error('[chip-manager] Payout event error:', eventError);
          // Rollback the deduction
          await supabase
            .from('player_balances')
            .update({
              available_chips: balance.available_chips,
              on_chain_chips: balance.on_chain_chips,
            })
            .eq('user_id', currentUser.id);
          return errorResponse('Failed to record payout request', 500);
        }

        console.log(`[chip-manager] Payout requested: ${chip_amount} chips = ${wover_amount} WOVER for user ${currentUser.id} to wallet ${primaryWallet.wallet_address}`);
        return successResponse({ 
          success: true, 
          chips_deducted: chip_amount,
          wover_pending: wover_amount,
          payout_wallet: primaryWallet.wallet_address,
          message: 'Payout request submitted. Admin will process your withdrawal.',
        });
      }

      case 'admin_process_payout': {
        // This would be called by admin after sending tokens
        const { tx_hash, pending_id } = body as any;

        if (!tx_hash || !pending_id) {
          return errorResponse('tx_hash and pending_id required', 400);
        }

        // Update the pending event to processed
        const { error: updateError } = await supabase
          .from('deposit_events')
          .update({ 
            processed: true,
            tx_hash,
          })
          .eq('id', pending_id);

        if (updateError) {
          console.error('[chip-manager] Admin payout update error:', updateError);
          return errorResponse('Failed to update payout status', 500);
        }

        console.log(`[chip-manager] Admin processed payout: ${pending_id} with tx ${tx_hash}`);
        return successResponse({ success: true });
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
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}
