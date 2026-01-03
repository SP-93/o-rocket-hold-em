import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/types/poker';
import { Json } from '@/integrations/supabase/types';

interface TableData {
  id: string;
  name: string;
  max_players: number;
  small_blind: number;
  big_blind: number;
  status: 'waiting' | 'playing' | 'paused';
  current_phase: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  pot: number;
  current_bet: number;
  dealer_position: number;
  active_player_seat: number | null;
  community_cards: Card[];
}

interface SeatData {
  id: string;
  table_id: string;
  seat_number: number;
  player_wallet: string | null;
  player_name: string | null;
  chip_stack: number;
  cards: Card[];
  is_dealer: boolean;
  is_small_blind: boolean;
  is_big_blind: boolean;
  is_turn: boolean;
  is_folded: boolean;
  last_action: 'fold' | 'check' | 'call' | 'raise' | 'all-in' | null;
  current_bet: number;
}

interface UsePokerTableResult {
  table: TableData | null;
  seats: SeatData[];
  loading: boolean;
  error: string | null;
  joinTable: (seatNumber: number, walletAddress: string, playerName?: string, buyIn?: number) => Promise<boolean>;
  leaveTable: (seatNumber: number) => Promise<boolean>;
  performAction: (seatNumber: number, action: 'fold' | 'check' | 'call' | 'raise' | 'all-in', amount?: number) => Promise<boolean>;
}

function parseCards(jsonCards: Json): Card[] {
  if (!jsonCards || !Array.isArray(jsonCards)) return [];
  return jsonCards as unknown as Card[];
}

export function usePokerTable(tableId: string): UsePokerTableResult {
  const [table, setTable] = useState<TableData | null>(null);
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch table
        const { data: tableData, error: tableError } = await supabase
          .from('poker_tables')
          .select('*')
          .eq('id', tableId)
          .maybeSingle();

        if (tableError) throw tableError;
        if (!tableData) {
          setError('Table not found');
          setLoading(false);
          return;
        }

        setTable({
          ...tableData,
          status: tableData.status as TableData['status'],
          current_phase: tableData.current_phase as TableData['current_phase'],
          community_cards: parseCards(tableData.community_cards),
        });

        // Fetch seats
        const { data: seatsData, error: seatsError } = await supabase
          .from('table_seats')
          .select('*')
          .eq('table_id', tableId)
          .order('seat_number');

        if (seatsError) throw seatsError;

        setSeats((seatsData || []).map(seat => ({
          ...seat,
          cards: parseCards(seat.cards),
          last_action: seat.last_action as SeatData['last_action'],
        })));

      } catch (err) {
        console.error('Error fetching table data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch table data');
      } finally {
        setLoading(false);
      }
    };

    if (tableId) {
      fetchData();
    }
  }, [tableId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!tableId) return;

    console.log('Setting up realtime subscriptions for table:', tableId);

    const channel = supabase
      .channel(`poker-table-${tableId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poker_tables',
          filter: `id=eq.${tableId}`,
        },
        (payload) => {
          console.log('Table update:', payload);
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newData = payload.new as any;
            setTable({
              ...newData,
              status: newData.status as TableData['status'],
              current_phase: newData.current_phase as TableData['current_phase'],
              community_cards: parseCards(newData.community_cards),
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_seats',
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => {
          console.log('Seat update:', payload);
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newSeat = payload.new as any;
            setSeats(prev => prev.map(seat => 
              seat.seat_number === newSeat.seat_number
                ? {
                    ...newSeat,
                    cards: parseCards(newSeat.cards),
                    last_action: newSeat.last_action as SeatData['last_action'],
                  }
                : seat
            ));
          } else if (payload.eventType === 'INSERT' && payload.new) {
            const newSeat = payload.new as any;
            setSeats(prev => {
              if (prev.find(s => s.seat_number === newSeat.seat_number)) {
                return prev.map(seat =>
                  seat.seat_number === newSeat.seat_number
                    ? {
                        ...newSeat,
                        cards: parseCards(newSeat.cards),
                        last_action: newSeat.last_action as SeatData['last_action'],
                      }
                    : seat
                );
              }
              return [...prev, {
                ...newSeat,
                cards: parseCards(newSeat.cards),
                last_action: newSeat.last_action as SeatData['last_action'],
              }].sort((a, b) => a.seat_number - b.seat_number);
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(channel);
    };
  }, [tableId]);

  // Join table
  const joinTable = useCallback(async (
    seatNumber: number,
    walletAddress: string,
    playerName?: string,
    buyIn: number = 1000
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('table_seats')
        .update({
          player_wallet: walletAddress,
          player_name: playerName || null,
          chip_stack: buyIn,
          is_folded: false,
          last_action: null,
          current_bet: 0,
        })
        .eq('table_id', tableId)
        .eq('seat_number', seatNumber)
        .is('player_wallet', null);

      if (error) throw error;

      // Log action
      await supabase.from('game_actions').insert({
        table_id: tableId,
        player_wallet: walletAddress,
        action: 'join',
        amount: buyIn,
      });

      return true;
    } catch (err) {
      console.error('Error joining table:', err);
      return false;
    }
  }, [tableId]);

  // Leave table
  const leaveTable = useCallback(async (seatNumber: number): Promise<boolean> => {
    try {
      const seat = seats.find(s => s.seat_number === seatNumber);
      if (!seat?.player_wallet) return false;

      const { error } = await supabase
        .from('table_seats')
        .update({
          player_wallet: null,
          player_name: null,
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
        .eq('table_id', tableId)
        .eq('seat_number', seatNumber);

      if (error) throw error;

      // Log action
      await supabase.from('game_actions').insert({
        table_id: tableId,
        player_wallet: seat.player_wallet,
        action: 'leave',
      });

      return true;
    } catch (err) {
      console.error('Error leaving table:', err);
      return false;
    }
  }, [tableId, seats]);

  // Perform action
  const performAction = useCallback(async (
    seatNumber: number,
    action: 'fold' | 'check' | 'call' | 'raise' | 'all-in',
    amount?: number
  ): Promise<boolean> => {
    try {
      const seat = seats.find(s => s.seat_number === seatNumber);
      if (!seat?.player_wallet) return false;

      const updates: Record<string, any> = {
        last_action: action,
        is_turn: false,
      };

      if (action === 'fold') {
        updates.is_folded = true;
      } else if (action === 'all-in') {
        updates.current_bet = seat.chip_stack;
        updates.chip_stack = 0;
      } else if (amount !== undefined) {
        updates.current_bet = amount;
        updates.chip_stack = seat.chip_stack - amount;
      }

      const { error } = await supabase
        .from('table_seats')
        .update(updates)
        .eq('table_id', tableId)
        .eq('seat_number', seatNumber);

      if (error) throw error;

      // Log action
      await supabase.from('game_actions').insert({
        table_id: tableId,
        player_wallet: seat.player_wallet,
        action,
        amount,
        phase: table?.current_phase,
      });

      return true;
    } catch (err) {
      console.error('Error performing action:', err);
      return false;
    }
  }, [tableId, seats, table]);

  return {
    table,
    seats,
    loading,
    error,
    joinTable,
    leaveTable,
    performAction,
  };
}
