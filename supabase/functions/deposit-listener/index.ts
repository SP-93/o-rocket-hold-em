import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// WOVER token address (Wrapped OVER) - for chip purchases
const WOVER_TOKEN_ADDRESS = '0x59c914C8ac6F212bb655737CC80d9Abc79A1e273';

// Admin wallet that receives deposits
const ADMIN_WALLET = '0x8334966329b7f4b459633696A8CA59118253bC89';

// 1 WOVER = 1 CHIP (direct 1:1 conversion)
const CHIPS_PER_WOVER = 1;

// WOVER has 18 decimals (like ETH)
const WOVER_DECIMALS = 18;

// ERC20 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

interface ProcessDepositRequest {
  action: 'process_transfer' | 'check_pending' | 'manual_verify';
  tx_hash?: string;
  from_address?: string;
  token_address?: string;
  amount?: string;
  block_number?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ProcessDepositRequest = await req.json();
    const { action } = body;

    console.log(`[deposit-listener] Action: ${action}`);

    switch (action) {
      case 'process_transfer': {
        const { tx_hash, from_address, token_address, amount, block_number } = body;

        if (!tx_hash || !from_address || !token_address || !amount || !block_number) {
          return errorResponse('Missing required fields', 400);
        }

        // Validate token address - only WOVER is accepted for chip deposits
        if (token_address.toLowerCase() !== WOVER_TOKEN_ADDRESS.toLowerCase()) {
          console.log(`[deposit-listener] Rejected non-WOVER token: ${token_address}`);
          return errorResponse('Only WOVER tokens accepted for chip deposits', 400);
        }

        // Check if already processed
        const { data: existing } = await supabase
          .from('deposit_events')
          .select('id')
          .eq('tx_hash', tx_hash)
          .single();

        if (existing) {
          console.log(`[deposit-listener] TX already processed: ${tx_hash}`);
          return successResponse({ success: true, already_processed: true });
        }

        // Calculate chips (amount is in wei, 18 decimals)
        // 1 WOVER = 1 CHIP
        const woverAmount = parseFloat(amount) / Math.pow(10, WOVER_DECIMALS);
        const chipsGranted = woverAmount * CHIPS_PER_WOVER;

        if (chipsGranted <= 0) {
          return errorResponse('Invalid amount', 400);
        }

        // Record the deposit event
        const { error: eventError } = await supabase
          .from('deposit_events')
          .insert({
            wallet_address: from_address.toLowerCase(),
            tx_hash,
            block_number,
            wover_amount: woverAmount,
            chips_granted: chipsGranted,
            event_type: 'deposit',
            processed: true,
          });

        if (eventError) {
          console.error('[deposit-listener] Event insert error:', eventError);
          return errorResponse('Failed to record event', 500);
        }

        // Get or create player balance
        const { data: currentBalance } = await supabase
          .from('player_balances')
          .select('*')
          .eq('wallet_address', from_address.toLowerCase())
          .single();

        if (currentBalance) {
          // Update existing balance
          const { error: updateError } = await supabase
            .from('player_balances')
            .update({
              on_chain_chips: currentBalance.on_chain_chips + chipsGranted,
              available_chips: currentBalance.available_chips + chipsGranted,
              total_deposited_wover: currentBalance.total_deposited_wover + woverAmount,
              last_sync_block: block_number,
              last_deposit_tx: tx_hash,
            })
            .eq('wallet_address', from_address.toLowerCase());

          if (updateError) {
            console.error('[deposit-listener] Balance update error:', updateError);
            return errorResponse('Failed to update balance', 500);
          }
        } else {
          // Create new balance record
          const { error: insertError } = await supabase
            .from('player_balances')
            .insert({
              wallet_address: from_address.toLowerCase(),
              on_chain_chips: chipsGranted,
              available_chips: chipsGranted,
              total_deposited_wover: woverAmount,
              last_sync_block: block_number,
              last_deposit_tx: tx_hash,
            });

          if (insertError) {
            console.error('[deposit-listener] Insert error:', insertError);
            return errorResponse('Failed to create balance', 500);
          }
        }

        console.log(`[deposit-listener] Processed deposit: ${woverAmount} WOVER = ${chipsGranted} chips for ${from_address}`);
        
        return successResponse({
          success: true,
          token: 'WOVER',
          amount: woverAmount,
          chips_granted: chipsGranted,
          wallet: from_address,
        });
      }

      case 'check_pending': {
        // Get last processed block
        const { data: config } = await supabase
          .from('platform_config')
          .select('value')
          .eq('id', 'last_processed_block')
          .single();

        const lastBlock = config?.value?.block_number || 0;

        return successResponse({
          last_processed_block: lastBlock,
          admin_wallet: ADMIN_WALLET,
          wover_token: WOVER_TOKEN_ADDRESS,
        });
      }

      case 'manual_verify': {
        // Manual verification endpoint for admin use
        const { tx_hash } = body;

        if (!tx_hash) {
          return errorResponse('tx_hash required', 400);
        }

        // Check if exists
        const { data: event } = await supabase
          .from('deposit_events')
          .select('*')
          .eq('tx_hash', tx_hash)
          .single();

        if (event) {
          return successResponse({
            found: true,
            event,
          });
        }

        return successResponse({
          found: false,
          message: 'Transaction not found in deposit events',
        });
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }

  } catch (error: unknown) {
    console.error('[deposit-listener] Error:', error);
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
