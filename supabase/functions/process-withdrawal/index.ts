import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Constants
const CHIPS_PER_TOKEN = 100;

// Token addresses
const TOKEN_ADDRESSES = {
  USDT: '0xA510432E4aa60B4acd476fb850EC84B7EE226b2d',
  USDC: '0x8712796136Ac8e0EEeC123251ef93702f265aa80',
};

interface WithdrawalRequest {
  wallet_address: string;
  chip_amount: number;
  token_type: 'USDT' | 'USDC';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body: WithdrawalRequest = await req.json();
    const { wallet_address, chip_amount, token_type } = body;

    console.log(`[process-withdrawal] Request: ${chip_amount} chips to ${token_type} for ${wallet_address}`);

    // Validate input
    if (!wallet_address || !chip_amount || !token_type) {
      return errorResponse('Missing required fields: wallet_address, chip_amount, token_type', 400);
    }

    if (chip_amount <= 0) {
      return errorResponse('Chip amount must be positive', 400);
    }

    if (!['USDT', 'USDC'].includes(token_type)) {
      return errorResponse('Invalid token type. Must be USDT or USDC', 400);
    }

    const walletLower = wallet_address.toLowerCase();

    // Get current balance
    const { data: balance, error: balanceError } = await supabase
      .from('player_balances')
      .select('*')
      .eq('wallet_address', walletLower)
      .single();

    if (balanceError || !balance) {
      console.error('[process-withdrawal] Balance not found:', balanceError);
      return errorResponse('Player balance not found', 404);
    }

    // Check available chips
    if (balance.available_chips < chip_amount) {
      return errorResponse(`Insufficient chips. Available: ${balance.available_chips}, Requested: ${chip_amount}`, 400);
    }

    // Calculate token amount
    const tokenAmount = chip_amount / CHIPS_PER_TOKEN;
    const tokenAddress = TOKEN_ADDRESSES[token_type];

    console.log(`[process-withdrawal] Converting ${chip_amount} chips to ${tokenAmount} ${token_type}`);

    // Deduct chips from balance first
    const { error: updateError } = await supabase
      .from('player_balances')
      .update({
        available_chips: balance.available_chips - chip_amount,
        on_chain_chips: balance.on_chain_chips - chip_amount,
        total_withdrawn_wover: balance.total_withdrawn_wover + tokenAmount,
      })
      .eq('wallet_address', walletLower);

    if (updateError) {
      console.error('[process-withdrawal] Update error:', updateError);
      return errorResponse('Failed to update balance', 500);
    }

    // Create withdrawal record
    const { error: eventError } = await supabase
      .from('deposit_events')
      .insert({
        wallet_address: walletLower,
        tx_hash: `pending_withdrawal_${Date.now()}_${walletLower.slice(0, 8)}`,
        block_number: 0,
        wover_amount: tokenAmount,
        chips_granted: chip_amount,
        event_type: 'withdrawal_pending',
        processed: false,
      });

    if (eventError) {
      console.error('[process-withdrawal] Event insert error:', eventError);
      // Don't fail - balance was already updated
    }

    // In a production environment, you would:
    // 1. Queue the withdrawal for processing by the admin
    // 2. Send tokens from the admin wallet to the user wallet
    // 3. Update the withdrawal record with the tx_hash once confirmed
    
    // For now, we'll return success indicating the withdrawal is queued
    console.log(`[process-withdrawal] Withdrawal queued: ${chip_amount} chips -> ${tokenAmount} ${token_type} to ${wallet_address}`);

    return successResponse({
      success: true,
      message: 'Withdrawal request queued for processing',
      chip_amount,
      token_amount: tokenAmount,
      token_type,
      token_address: tokenAddress,
      new_available_chips: balance.available_chips - chip_amount,
    });

  } catch (error: unknown) {
    console.error('[process-withdrawal] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});

function successResponse(data: unknown) {
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
