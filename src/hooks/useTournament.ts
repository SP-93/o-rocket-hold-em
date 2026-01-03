import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Tournament {
  id: string;
  name: string;
  tournament_type: 'sit_and_go' | 'heads_up' | 'winner_takes_all';
  status: 'registering' | 'running' | 'finished' | 'cancelled';
  max_players: number;
  entry_chips: number;
  entry_wover_value: number;
  starting_stack: number;
  prize_pool: number;
  blind_structure: BlindLevel[];
  payout_structure: 'winner_takes_all' | 'top_3' | 'top_2';
  payout_percentages: number[];
  platform_rake_percent: number;
  started_at: string | null;
  finished_at: string | null;
  created_by: string;
}

interface BlindLevel {
  level: number;
  small_blind: number;
  big_blind: number;
  ante: number;
  duration_minutes: number;
}

interface TournamentPlayer {
  id: string;
  tournament_id: string;
  wallet_address: string;
  username: string;
  is_eliminated: boolean;
  eliminated_at: string | null;
  placement: number | null;
  payout_amount: number;
}

interface TournamentState {
  tournament: Tournament | null;
  players: TournamentPlayer[];
  currentBlindLevel: number;
  timeToNextLevel: number;
  isRegistered: boolean;
}

export function useTournament(tournamentId: string) {
  const [state, setState] = useState<TournamentState>({
    tournament: null,
    players: [],
    currentBlindLevel: 0,
    timeToNextLevel: 0,
    isRegistered: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchTournament = useCallback(async () => {
    if (!tournamentId) return;

    try {
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) throw tournamentError;

      const { data: players, error: playersError } = await supabase
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('placement', { ascending: true, nullsFirst: false });

      if (playersError) throw playersError;

      // Calculate current blind level based on time elapsed
      let currentBlindLevel = 0;
      let timeToNextLevel = 0;

      if (tournament.status === 'running' && tournament.started_at) {
        const startTime = new Date(tournament.started_at).getTime();
        const now = Date.now();
        const elapsedMinutes = (now - startTime) / 60000;

        const blindStructure = tournament.blind_structure as unknown as BlindLevel[];
        let accumulatedTime = 0;

        for (let i = 0; i < blindStructure.length; i++) {
          accumulatedTime += blindStructure[i].duration_minutes;
          if (elapsedMinutes < accumulatedTime) {
            currentBlindLevel = i;
            timeToNextLevel = Math.ceil((accumulatedTime - elapsedMinutes) * 60);
            break;
          }
        }

        if (currentBlindLevel === 0 && elapsedMinutes >= accumulatedTime) {
          currentBlindLevel = blindStructure.length - 1;
        }
      }

      setState({
        tournament: {
          ...tournament,
          blind_structure: tournament.blind_structure as unknown as BlindLevel[],
          payout_percentages: tournament.payout_percentages as unknown as number[],
        },
        players: players || [],
        currentBlindLevel,
        timeToNextLevel,
        isRegistered: false,
      });
    } catch (error) {
      console.error('Error fetching tournament:', error);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTournament();

    // Subscribe to tournament updates
    const channel = supabase
      .channel(`tournament-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`,
        },
        () => fetchTournament()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_registrations',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => fetchTournament()
      )
      .subscribe();

    // Timer for blind level countdown
    const timer = setInterval(() => {
      setState(prev => ({
        ...prev,
        timeToNextLevel: Math.max(0, prev.timeToNextLevel - 1),
      }));
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [tournamentId, fetchTournament]);

  const registerForTournament = async (walletAddress: string, username: string) => {
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournamentId,
          wallet_address: walletAddress.toLowerCase(),
          username,
        });

      if (error) throw error;

      // Update prize pool
      if (state.tournament) {
        const newPrizePool = (state.tournament.prize_pool || 0) + state.tournament.entry_wover_value;
        await supabase
          .from('tournaments')
          .update({ prize_pool: newPrizePool })
          .eq('id', tournamentId);
      }

      return true;
    } catch (error) {
      console.error('Error registering for tournament:', error);
      return false;
    }
  };

  const eliminatePlayer = async (walletAddress: string) => {
    try {
      const activePlayers = state.players.filter(p => !p.is_eliminated);
      const placement = activePlayers.length;

      const { error } = await supabase
        .from('tournament_registrations')
        .update({
          is_eliminated: true,
          eliminated_at: new Date().toISOString(),
          placement,
        })
        .eq('tournament_id', tournamentId)
        .eq('wallet_address', walletAddress.toLowerCase());

      if (error) throw error;

      // Check if tournament should end
      const remainingPlayers = activePlayers.length - 1;
      if (remainingPlayers === 1 && state.tournament) {
        await finishTournament();
      }

      return true;
    } catch (error) {
      console.error('Error eliminating player:', error);
      return false;
    }
  };

  const finishTournament = async () => {
    if (!state.tournament) return false;

    try {
      // Get final standings
      const { data: finalPlayers } = await supabase
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('is_eliminated', { ascending: true })
        .order('eliminated_at', { ascending: false, nullsFirst: true });

      if (!finalPlayers) return false;

      // Calculate payouts
      const prizePool = state.tournament.prize_pool || 0;
      const rake = prizePool * (state.tournament.platform_rake_percent / 100);
      const distributablePrize = prizePool - rake;
      const payoutPercentages = state.tournament.payout_percentages;

      // Award placement to winner (the one not eliminated)
      const winner = finalPlayers.find(p => !p.is_eliminated);
      if (winner) {
        await supabase
          .from('tournament_registrations')
          .update({
            placement: 1,
            payout_amount: Math.floor(distributablePrize * (payoutPercentages[0] / 100)),
          })
          .eq('id', winner.id);
      }

      // Award payouts to other placements
      const eliminatedPlayers = finalPlayers.filter(p => p.is_eliminated);
      for (let i = 0; i < eliminatedPlayers.length && i < payoutPercentages.length - 1; i++) {
        const player = eliminatedPlayers[i];
        const payout = Math.floor(distributablePrize * (payoutPercentages[player.placement! - 1] / 100));
        
        if (payout > 0) {
          await supabase
            .from('tournament_registrations')
            .update({ payout_amount: payout })
            .eq('id', player.id);
        }
      }

      // Update tournament status
      await supabase
        .from('tournaments')
        .update({
          status: 'finished',
          finished_at: new Date().toISOString(),
        })
        .eq('id', tournamentId);

      return true;
    } catch (error) {
      console.error('Error finishing tournament:', error);
      return false;
    }
  };

  const getCurrentBlinds = () => {
    if (!state.tournament || !state.tournament.blind_structure) {
      return { small_blind: 0, big_blind: 0, ante: 0 };
    }
    const level = state.tournament.blind_structure[state.currentBlindLevel];
    return level || state.tournament.blind_structure[0];
  };

  return {
    ...state,
    loading,
    refetch: fetchTournament,
    registerForTournament,
    eliminatePlayer,
    finishTournament,
    getCurrentBlinds,
  };
}
