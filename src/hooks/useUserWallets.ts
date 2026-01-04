import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserWallet {
  id: string;
  wallet_address: string;
  is_primary: boolean;
  label: string | null;
  connected_at: string;
  last_used_at: string;
}

interface UseUserWalletsResult {
  wallets: UserWallet[];
  primaryWallet: UserWallet | null;
  isLoading: boolean;
  error: string | null;
  connectWallet: (address: string, signature: string, label?: string) => Promise<{ success: boolean; error?: string }>;
  disconnectWallet: (walletId: string) => Promise<{ success: boolean; error?: string }>;
  setPrimaryWallet: (walletId: string) => Promise<{ success: boolean; error?: string }>;
  updateWalletLabel: (walletId: string, label: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

export function useUserWallets(): UseUserWalletsResult {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    if (!user) {
      setWallets([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('connected_at', { ascending: true });

      if (fetchError) throw fetchError;

      setWallets(data || []);
    } catch (err) {
      console.error('Error fetching wallets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch wallets');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`wallets-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchWallets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchWallets]);

  const connectWallet = useCallback(async (
    address: string,
    signature: string,
    label?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // Check if wallet is already linked to another user
      const { data: existing } = await supabase
        .from('user_wallets')
        .select('user_id')
        .eq('wallet_address', address.toLowerCase())
        .single();

      if (existing && existing.user_id !== user.id) {
        return { success: false, error: 'This wallet is already linked to another account' };
      }

      if (existing && existing.user_id === user.id) {
        return { success: false, error: 'This wallet is already linked to your account' };
      }

      // Check if this is the first wallet (make it primary)
      const isPrimary = wallets.length === 0;

      const { error: insertError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: user.id,
          wallet_address: address.toLowerCase(),
          is_primary: isPrimary,
          label: label || null,
        });

      if (insertError) throw insertError;

      // Update player_profiles and player_balances with wallet address if primary
      if (isPrimary) {
        await supabase
          .from('player_profiles')
          .update({ wallet_address: address.toLowerCase() })
          .eq('user_id', user.id);

        await supabase
          .from('player_balances')
          .update({ wallet_address: address.toLowerCase() })
          .eq('user_id', user.id);
      }

      await fetchWallets();
      return { success: true };
    } catch (err) {
      console.error('Error connecting wallet:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to connect wallet' };
    }
  }, [user, wallets.length, fetchWallets]);

  const disconnectWallet = useCallback(async (walletId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Prevent disconnecting the last wallet
    if (wallets.length <= 1) {
      return { success: false, error: 'Cannot disconnect your only wallet' };
    }

    try {
      const walletToRemove = wallets.find(w => w.id === walletId);
      if (!walletToRemove) {
        return { success: false, error: 'Wallet not found' };
      }

      const { error: deleteError } = await supabase
        .from('user_wallets')
        .delete()
        .eq('id', walletId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // If we removed the primary wallet, set a new primary
      if (walletToRemove.is_primary) {
        const remainingWallet = wallets.find(w => w.id !== walletId);
        if (remainingWallet) {
          await supabase
            .from('user_wallets')
            .update({ is_primary: true })
            .eq('id', remainingWallet.id);

          // Update profiles/balances with new primary
          await supabase
            .from('player_profiles')
            .update({ wallet_address: remainingWallet.wallet_address })
            .eq('user_id', user.id);

          await supabase
            .from('player_balances')
            .update({ wallet_address: remainingWallet.wallet_address })
            .eq('user_id', user.id);
        }
      }

      await fetchWallets();
      return { success: true };
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to disconnect wallet' };
    }
  }, [user, wallets, fetchWallets]);

  const setPrimaryWallet = useCallback(async (walletId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      // The trigger will handle unsetting other primaries
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ is_primary: true })
        .eq('id', walletId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update profiles/balances with new primary
      await supabase
        .from('player_profiles')
        .update({ wallet_address: wallet.wallet_address })
        .eq('user_id', user.id);

      await supabase
        .from('player_balances')
        .update({ wallet_address: wallet.wallet_address })
        .eq('user_id', user.id);

      await fetchWallets();
      return { success: true };
    } catch (err) {
      console.error('Error setting primary wallet:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to set primary wallet' };
    }
  }, [user, wallets, fetchWallets]);

  const updateWalletLabel = useCallback(async (walletId: string, label: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ label })
        .eq('id', walletId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await fetchWallets();
      return { success: true };
    } catch (err) {
      console.error('Error updating wallet label:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update label' };
    }
  }, [user, fetchWallets]);

  const primaryWallet = wallets.find(w => w.is_primary) || wallets[0] || null;

  return {
    wallets,
    primaryWallet,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    setPrimaryWallet,
    updateWalletLabel,
    refetch: fetchWallets,
  };
}
