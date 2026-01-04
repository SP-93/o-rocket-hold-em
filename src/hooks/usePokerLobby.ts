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
  is_private: boolean;
  creator_wallet: string | null;
}

interface UsePokerLobbyResult {
  tables: LobbyTable[];
  loading: boolean;
  error: string | null;
  createTable: (
    name: string, 
    maxPlayers: 5 | 6, 
    smallBlind: number, 
    bigBlind: number,
    isPrivate?: boolean,
    password?: string,
    allowedPlayers?: string[],
    creatorWallet?: string,
    creationFeeTx?: string,
    creationFeeToken?: string
  ) => Promise<string | null>;
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
      // Fetch tables from safe view (hides password)
      const { data: tablesData, error: tablesError } = await supabase
        .from('poker_tables_safe')
        .select(`
          id,
          name,
          max_players,
          small_blind,
          big_blind,
          status,
          pot,
          created_at,
          is_private,
          creator_wallet,
          password_protected
        `)
        .order('created_at', { ascending: false });

      if (tablesError) throw tablesError;

      console.log('[usePokerLobby] tablesData:', tablesData?.length ?? 0, 'tables');

      // Fetch player counts for each table (guard against empty array)
      const tableIds = (tablesData || []).map(t => t.id).filter(Boolean);
      
      let seatsData: { table_id: string; player_wallet: string }[] = [];
      if (tableIds.length > 0) {
        const { data, error: seatsError } = await supabase
          .from('table_seats')
          .select('table_id, player_wallet')
          .in('table_id', tableIds)
          .not('player_wallet', 'is', null);

        if (seatsError) {
          console.error('[usePokerLobby] seatsError:', seatsError.message);
          throw seatsError;
        }
        seatsData = data || [];
      }

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
        is_private: table.is_private ?? false,
        creator_wallet: table.creator_wallet,
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
    bigBlind: number,
    isPrivate: boolean = false,
    password?: string,
    allowedPlayers?: string[],
    creatorWallet?: string,
    creationFeeTx?: string,
    creationFeeToken?: string
  ): Promise<string | null> => {
    try {
      // Use table-manager edge function for secure table creation
      const { data, error } = await supabase.functions.invoke('table-manager', {
        body: {
          action: 'create_table',
          name,
          maxPlayers,
          smallBlind,
          bigBlind,
          isPrivate,
          password: isPrivate ? password : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data?.table?.id || null;
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
