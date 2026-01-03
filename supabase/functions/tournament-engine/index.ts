import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TournamentRequest {
  action: 'start' | 'eliminate' | 'finish' | 'get_status';
  tournament_id: string;
  wallet_address?: string;
  admin_wallet?: string;
}

interface BlindLevel {
  level: number;
  small_blind: number;
  big_blind: number;
  ante: number;
  duration_minutes: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: TournamentRequest = await req.json();
    const { action, tournament_id, wallet_address, admin_wallet } = body;

    console.log(`[tournament-engine] Action: ${action}, Tournament: ${tournament_id}`);

    // Check admin role for admin-only actions
    const checkAdmin = async (wallet: string): Promise<boolean> => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('wallet_address', wallet.toLowerCase())
        .eq('role', 'admin')
        .maybeSingle();
      return !!data;
    };

    switch (action) {
      case 'start': {
        if (!admin_wallet) {
          return errorResponse('admin_wallet required', 400);
        }

        const isAdmin = await checkAdmin(admin_wallet);
        if (!isAdmin) {
          return errorResponse('Unauthorized: Admin only', 403);
        }

        // Get tournament
        const { data: tournament, error: tournamentError } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', tournament_id)
          .single();

        if (tournamentError || !tournament) {
          return errorResponse('Tournament not found', 404);
        }

        if (tournament.status !== 'registering') {
          return errorResponse('Tournament is not in registering state', 400);
        }

        // Get registered players
        const { data: players, error: playersError } = await supabase
          .from('tournament_registrations')
          .select('*')
          .eq('tournament_id', tournament_id);

        if (playersError) {
          return errorResponse('Failed to fetch players', 500);
        }

        const playerCount = players?.length || 0;
        if (playerCount < 2) {
          return errorResponse('Need at least 2 players to start', 400);
        }

        // Start the tournament
        const { error: startError } = await supabase
          .from('tournaments')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
          })
          .eq('id', tournament_id);

        if (startError) {
          return errorResponse('Failed to start tournament', 500);
        }

        console.log(`[tournament-engine] Started tournament ${tournament_id} with ${playerCount} players`);
        return successResponse({ success: true, player_count: playerCount });
      }

      case 'eliminate': {
        if (!wallet_address) {
          return errorResponse('wallet_address required', 400);
        }

        // Get tournament
        const { data: tournament } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', tournament_id)
          .single();

        if (!tournament || tournament.status !== 'running') {
          return errorResponse('Tournament is not running', 400);
        }

        // Get active players count
        const { data: activePlayers } = await supabase
          .from('tournament_registrations')
          .select('*')
          .eq('tournament_id', tournament_id)
          .eq('is_eliminated', false);

        const placement = activePlayers?.length || 1;

        // Eliminate player
        const { error: eliminateError } = await supabase
          .from('tournament_registrations')
          .update({
            is_eliminated: true,
            eliminated_at: new Date().toISOString(),
            placement,
          })
          .eq('tournament_id', tournament_id)
          .eq('wallet_address', wallet_address.toLowerCase());

        if (eliminateError) {
          return errorResponse('Failed to eliminate player', 500);
        }

        console.log(`[tournament-engine] Eliminated ${wallet_address} at position ${placement}`);

        // Check if tournament should end (only 1 player left)
        const remainingPlayers = (activePlayers?.length || 0) - 1;
        if (remainingPlayers === 1) {
          // Find the winner (the one not eliminated)
          const winner = activePlayers?.find(p => p.wallet_address.toLowerCase() !== wallet_address.toLowerCase());
          
          if (winner) {
            // Award 1st place to winner
            const prizePool = tournament.prize_pool || 0;
            const rake = prizePool * (tournament.platform_rake_percent / 100);
            const distributablePrize = prizePool - rake;
            const payoutPercentages = tournament.payout_percentages as number[];

            const winnerPayout = Math.floor(distributablePrize * (payoutPercentages[0] / 100));

            await supabase
              .from('tournament_registrations')
              .update({
                placement: 1,
                payout_amount: winnerPayout,
              })
              .eq('id', winner.id);

            // Calculate 2nd place payout if applicable
            if (payoutPercentages.length > 1) {
              const secondPayout = Math.floor(distributablePrize * (payoutPercentages[1] / 100));
              await supabase
                .from('tournament_registrations')
                .update({ payout_amount: secondPayout })
                .eq('tournament_id', tournament_id)
                .eq('placement', 2);
            }

            // Mark tournament as finished
            await supabase
              .from('tournaments')
              .update({
                status: 'finished',
                finished_at: new Date().toISOString(),
              })
              .eq('id', tournament_id);

            console.log(`[tournament-engine] Tournament ${tournament_id} finished. Winner: ${winner.username}`);
          }
        }

        return successResponse({ success: true, placement, remaining: remainingPlayers });
      }

      case 'finish': {
        if (!admin_wallet) {
          return errorResponse('admin_wallet required', 400);
        }

        const isAdmin = await checkAdmin(admin_wallet);
        if (!isAdmin) {
          return errorResponse('Unauthorized: Admin only', 403);
        }

        // Force finish the tournament
        const { error: finishError } = await supabase
          .from('tournaments')
          .update({
            status: 'finished',
            finished_at: new Date().toISOString(),
          })
          .eq('id', tournament_id);

        if (finishError) {
          return errorResponse('Failed to finish tournament', 500);
        }

        return successResponse({ success: true });
      }

      case 'get_status': {
        const { data: tournament } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', tournament_id)
          .single();

        if (!tournament) {
          return errorResponse('Tournament not found', 404);
        }

        const { data: players } = await supabase
          .from('tournament_registrations')
          .select('*')
          .eq('tournament_id', tournament_id);

        const activePlayers = players?.filter(p => !p.is_eliminated) || [];
        const eliminatedPlayers = players?.filter(p => p.is_eliminated) || [];

        // Calculate current blind level
        let currentLevel = 0;
        if (tournament.status === 'running' && tournament.started_at) {
          const startTime = new Date(tournament.started_at).getTime();
          const elapsedMinutes = (Date.now() - startTime) / 60000;
          const blindStructure = tournament.blind_structure as BlindLevel[];
          
          let accumulatedTime = 0;
          for (let i = 0; i < blindStructure.length; i++) {
            accumulatedTime += blindStructure[i].duration_minutes;
            if (elapsedMinutes < accumulatedTime) {
              currentLevel = i;
              break;
            }
          }
        }

        return successResponse({
          tournament,
          active_players: activePlayers.length,
          eliminated_players: eliminatedPlayers.length,
          current_blind_level: currentLevel,
        });
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }

  } catch (error: unknown) {
    console.error('[tournament-engine] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});

function successResponse(data: Record<string, unknown>) {
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
