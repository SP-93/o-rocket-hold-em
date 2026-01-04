import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function successResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action } = body;

    // All actions require authentication
    const { user, error: authError } = await getUserFromRequest(req, supabaseAuth);
    if (authError) {
      console.log(`[table-manager] Auth failed: ${authError}`);
      return errorResponse(authError, 401);
    }
    console.log(`[table-manager] Authenticated user: ${user.id}`);

    // Get user's primary wallet
    const { data: userWallet } = await supabase
      .from('user_wallets')
      .select('wallet_address')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle();

    const walletAddress = userWallet?.wallet_address?.toLowerCase() || '';

    switch (action) {
      case "create_table": {
        const { name, maxPlayers, smallBlind, bigBlind, isPrivate, password } = body;

        if (!name || !maxPlayers || !smallBlind || !bigBlind) {
          return errorResponse("Missing required fields", 400);
        }

        // Validate inputs
        if (maxPlayers < 2 || maxPlayers > 9) {
          return errorResponse("Max players must be between 2 and 9", 400);
        }
        if (smallBlind < 1 || bigBlind < smallBlind) {
          return errorResponse("Invalid blind values", 400);
        }

        // Create table
        const { data: table, error: tableError } = await supabase
          .from('poker_tables')
          .insert({
            name,
            max_players: maxPlayers,
            small_blind: smallBlind,
            big_blind: bigBlind,
            is_private: isPrivate || false,
            table_password: isPrivate ? password : null,
            creator_wallet: walletAddress,
            status: 'waiting',
            current_phase: 'waiting',
          })
          .select()
          .single();

        if (tableError) {
          console.error('[table-manager] Create table error:', tableError);
          return errorResponse("Failed to create table", 500);
        }

        // Create seats for the table
        const seats = [];
        for (let i = 0; i < maxPlayers; i++) {
          seats.push({
            table_id: table.id,
            seat_number: i,
            chip_stack: 0,
          });
        }

        await supabase.from('table_seats').insert(seats);

        console.log(`[table-manager] Created table ${table.id} by user ${user.id}`);
        return successResponse({ success: true, table });
      }

      case "join_seat": {
        const { tableId, seatNumber, buyIn } = body;

        if (!tableId || seatNumber === undefined || !buyIn) {
          return errorResponse("Missing required fields", 400);
        }

        // Verify seat is empty
        const { data: seat } = await supabase
          .from('table_seats')
          .select('*')
          .eq('table_id', tableId)
          .eq('seat_number', seatNumber)
          .maybeSingle();

        if (!seat) {
          return errorResponse("Seat not found", 404);
        }
        if (seat.player_wallet) {
          return errorResponse("Seat is occupied", 400);
        }

        // Check user isn't already at this table
        const { data: existingSeat } = await supabase
          .from('table_seats')
          .select('*')
          .eq('table_id', tableId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingSeat) {
          return errorResponse("You're already seated at this table", 400);
        }

        // Get player profile
        const { data: profile } = await supabase
          .from('player_profiles')
          .select('username')
          .eq('user_id', user.id)
          .maybeSingle();

        // Update seat
        const { error: updateError } = await supabase
          .from('table_seats')
          .update({
            player_wallet: walletAddress,
            player_name: profile?.username || null,
            user_id: user.id,
            chip_stack: buyIn,
            on_chain_buy_in: buyIn,
            is_folded: false,
            last_action: null,
            current_bet: 0,
          })
          .eq('id', seat.id);

        if (updateError) {
          console.error('[table-manager] Join seat error:', updateError);
          return errorResponse("Failed to join seat", 500);
        }

        console.log(`[table-manager] User ${user.id} joined seat ${seatNumber} at table ${tableId}`);
        return successResponse({ success: true });
      }

      case "leave_seat": {
        const { tableId, seatNumber } = body;

        // Verify seat belongs to user
        const { data: seat } = await supabase
          .from('table_seats')
          .select('*')
          .eq('table_id', tableId)
          .eq('seat_number', seatNumber)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!seat) {
          return errorResponse("Seat not found or doesn't belong to you", 403);
        }

        // Clear seat
        const { error: updateError } = await supabase
          .from('table_seats')
          .update({
            player_wallet: null,
            player_name: null,
            user_id: null,
            chip_stack: 0,
            cards: [],
            is_dealer: false,
            is_small_blind: false,
            is_big_blind: false,
            is_turn: false,
            is_folded: false,
            last_action: null,
            current_bet: 0,
          })
          .eq('id', seat.id);

        if (updateError) {
          console.error('[table-manager] Leave seat error:', updateError);
          return errorResponse("Failed to leave seat", 500);
        }

        // Return chips to balance
        if (seat.chip_stack > 0) {
          await supabase
            .from('player_balances')
            .update({
              available_chips: seat.chip_stack,
              locked_in_games: 0,
            })
            .eq('user_id', user.id);
        }

        console.log(`[table-manager] User ${user.id} left seat ${seatNumber} at table ${tableId}`);
        return successResponse({ success: true, chipsReturned: seat.chip_stack });
      }

      case "delete_table": {
        const { tableId } = body;

        // Verify table exists and user is creator
        const { data: table } = await supabase
          .from('poker_tables')
          .select('*')
          .eq('id', tableId)
          .maybeSingle();

        if (!table) {
          return errorResponse("Table not found", 404);
        }
        if (table.creator_wallet?.toLowerCase() !== walletAddress) {
          return errorResponse("Only the table creator can delete the table", 403);
        }

        // Check if table is empty
        const { data: occupiedSeats } = await supabase
          .from('table_seats')
          .select('id')
          .eq('table_id', tableId)
          .not('player_wallet', 'is', null);

        if (occupiedSeats && occupiedSeats.length > 0) {
          return errorResponse("Cannot delete table with players", 400);
        }

        // Delete seats first
        await supabase.from('table_seats').delete().eq('table_id', tableId);
        
        // Delete table
        await supabase.from('poker_tables').delete().eq('id', tableId);

        console.log(`[table-manager] Deleted table ${tableId} by user ${user.id}`);
        return successResponse({ success: true });
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (error: unknown) {
    console.error("[table-manager] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
});
