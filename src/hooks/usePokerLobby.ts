import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LobbyTable {
  id: string;
  name: string;
  max_players: number;
  small_blind: number;
  big_blind: number;
  status: 'waiting' | 'playing' | 'paused';
  current_players: number;
  avg_pot: number;
  created_at: string;
}

interface UsePokerLobbyResult {
  tables: LobbyTable[];
  loading: boolean;
  error: string | null;
  createTable: (name: string, maxPlayers: 5 | 6, smallBlind: number, bigBlind: number) => Promise<string | null>;
  refetch: () => Promise<void>;
}

export function usePokerLobby(): UsePokerLobbyResult {
  const [tables, setTables] = useState<LobbyTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch tables with seat counts
      const { data: tablesData, error: tablesError } = await supabase
        .from('poker_tables')
        .select(`
          id,
          name,
          max_players,
          small_blind,
          big_blind,
          status,
          pot,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (tablesError) throw tablesError;

      // Fetch player counts for each table
      const tableIds = (tablesData || []).map(t => t.id);
      const { data: seatsData, error: seatsError } = await supabase
        .from('table_seats')
        .select('table_id, player_wallet')
        .in('table_id', tableIds)
        .not('player_wallet', 'is', null);

      if (seatsError) throw seatsError;

      // Count players per table
      const playerCounts: Record<string, number> = {};
      (seatsData || []).forEach(seat => {
        playerCounts[seat.table_id] = (playerCounts[seat.table_id] || 0) + 1;
      });

      const formattedTables: LobbyTable[] = (tablesData || []).map(table => ({
        id: table.id,
        name: table.name,
        max_players: table.max_players,
        small_blind: table.small_blind,
        big_blind: table.big_blind,
        status: table.status as LobbyTable['status'],
        current_players: playerCounts[table.id] || 0,
        avg_pot: table.pot || 0,
        created_at: table.created_at,
      }));

      setTables(formattedTables);
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('lobby-tables')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poker_tables',
        },
        () => {
          console.log('Tables changed, refetching...');
          fetchTables();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_seats',
        },
        () => {
          console.log('Seats changed, refetching...');
          fetchTables();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createTable = async (
    name: string,
    maxPlayers: 5 | 6,
    smallBlind: number,
    bigBlind: number
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('poker_tables')
        .insert({
          name,
          max_players: maxPlayers,
          small_blind: smallBlind,
          big_blind: bigBlind,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Create seats for the new table
      const seatInserts = Array.from({ length: maxPlayers }, (_, i) => ({
        table_id: data.id,
        seat_number: i + 1,
      }));

      await supabase.from('table_seats').insert(seatInserts);

      return data.id;
    } catch (err) {
      console.error('Error creating table:', err);
      return null;
    }
  };

  return {
    tables,
    loading,
    error,
    createTable,
    refetch: fetchTables,
  };
}
