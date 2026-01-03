import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletContext';

interface ChipBalance {
  availableChips: number;
  lockedInGames: number;
  onChainChips: number;
  totalDepositedWover: number;
  totalWithdrawnWover: number;
}

export function useChipBalance() {
  const { address, isConnected } = useWalletContext();
  const [balance, setBalance] = useState<ChipBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('player_balances')
        .select('*')
        .eq('wallet_address', address.toLowerCase())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBalance({
          availableChips: data.available_chips,
          lockedInGames: data.locked_in_games,
          onChainChips: data.on_chain_chips,
          totalDepositedWover: data.total_deposited_wover,
          totalWithdrawnWover: data.total_withdrawn_wover,
        });
      } else {
        // No balance record yet
        setBalance({
          availableChips: 0,
          lockedInGames: 0,
          onChainChips: 0,
          totalDepositedWover: 0,
          totalWithdrawnWover: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching chip balance:', error);
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [isConnected, fetchBalance]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!address) return;

    const channel = supabase
      .channel(`balance-${address}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_balances',
          filter: `wallet_address=eq.${address.toLowerCase()}`,
        },
        () => {
          fetchBalance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address, fetchBalance]);

  return {
    balance,
    isLoading,
    refetch: fetchBalance,
    totalChips: balance ? balance.availableChips + balance.lockedInGames : 0,
  };
}
