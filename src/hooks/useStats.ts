import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformStats {
  playerCount: number;
  tableCount: number;
  totalPot: number;
}

export function useStats() {
  const [stats, setStats] = useState<PlatformStats>({
    playerCount: 0,
    tableCount: 0,
    totalPot: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Count unique players
        const { count: playerCount } = await supabase
          .from('player_profiles')
          .select('*', { count: 'exact', head: true });

        // Count active tables
        const { count: tableCount } = await supabase
          .from('poker_tables')
          .select('*', { count: 'exact', head: true });

        // Sum of pots from active games
        const { data: potData } = await supabase
          .from('poker_tables')
          .select('pot')
          .eq('status', 'playing');

        const totalPot = potData?.reduce((sum, t) => sum + (t.pot || 0), 0) || 0;

        setStats({
          playerCount: playerCount || 0,
          tableCount: tableCount || 0,
          totalPot,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
}
