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
        // Fetch table from safe view (hides password)
        const { data: tableData, error: tableError } = await supabase
          .from('poker_tables_safe')
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

        // Fetch seats from safe view (hides other players' cards)
        const { data: seatsData, error: seatsError } = await supabase
          .from('table_seats_safe')
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

  // Join table - uses table-manager edge function for security
  const joinTable = useCallback(async (
    seatNumber: number,
    walletAddress: string,
    playerName?: string,
    buyIn: number = 100
  ): Promise<boolean> => {
    try {
      console.log(`[usePokerTable] Joining table ${tableId}, seat ${seatNumber}, buyIn: ${buyIn}`);
      
      // First, validate and lock chips via chip-manager edge function
      const { data: chipData, error: chipError } = await supabase.functions.invoke('chip-manager', {
        body: {
          action: 'join_table',
          walletAddress: walletAddress.toLowerCase(),
          tableId,
          amount: buyIn,
        },
      });

      if (chipError) {
        console.error('[usePokerTable] Chip manager error:', chipError);
        throw new Error('Failed to lock chips for table');
      }

      if (!chipData?.success) {
        console.error('[usePokerTable] Chip validation failed:', chipData?.error);
        throw new Error(chipData?.error || 'Insufficient chips. Please buy chips first.');
      }

      console.log('[usePokerTable] Chips locked successfully:', chipData);

      // Join seat via table-manager edge function (uses service role)
      const { data, error } = await supabase.functions.invoke('table-manager', {
        body: {
          action: 'join_seat',
          tableId,
          seatNumber,
          buyIn,
        },
      });

      if (error || data?.error) {
        // If seat join failed, unlock the chips
        console.error('[usePokerTable] Join seat failed:', error || data?.error);
        await supabase.functions.invoke('chip-manager', {
          body: {
            action: 'leave_table',
            walletAddress: walletAddress.toLowerCase(),
            tableId,
            amount: buyIn,
          },
        });
        throw new Error(data?.error || 'Failed to join seat');
      }

      console.log('[usePokerTable] Joined seat successfully');
      return true;
    } catch (err) {
      console.error('Error joining table:', err);
      return false;
    }
  }, [tableId]);

  // Leave table - uses table-manager edge function for security
  const leaveTable = useCallback(async (seatNumber: number): Promise<boolean> => {
    try {
      const seat = seats.find(s => s.seat_number === seatNumber);
      if (!seat?.player_wallet) return false;

      // Leave via table-manager edge function
      const { data, error } = await supabase.functions.invoke('table-manager', {
        body: {
          action: 'leave_seat',
          tableId,
          seatNumber,
        },
      });

      if (error || data?.error) {
        console.error('[usePokerTable] Leave seat failed:', error || data?.error);
        throw new Error(data?.error || 'Failed to leave seat');
      }

      console.log('[usePokerTable] Left seat successfully, chips returned:', data?.chipsReturned);
      return true;
    } catch (err) {
      console.error('Error leaving table:', err);
      return false;
    }
  }, [tableId, seats]);

  // Perform action via poker-game edge function
  const performAction = useCallback(async (
    seatNumber: number,
    action: 'fold' | 'check' | 'call' | 'raise' | 'all-in',
    amount?: number
  ): Promise<boolean> => {
    try {
      const seat = seats.find(s => s.seat_number === seatNumber);
      if (!seat?.player_wallet) return false;

      console.log(`[usePokerTable] Performing action: ${action} for seat ${seatNumber}`);

      const { data, error } = await supabase.functions.invoke('poker-game', {
        body: {
          action: 'process_action',
          tableId,
          seatNumber,
          walletAddress: seat.player_wallet,
          playerAction: action,
          amount,
        },
      });

      if (error) {
        console.error('[usePokerTable] Edge function error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('[usePokerTable] Game error:', data.error);
        throw new Error(data.error);
      }

      console.log('[usePokerTable] Action result:', data);
      return true;
    } catch (err) {
      console.error('Error performing action:', err);
      return false;
    }
  }, [tableId, seats]);

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
