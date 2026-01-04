import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// The MASTER_ADMIN wallet - only this wallet can add other admins
export const MASTER_ADMIN_WALLET = '0x8334966329b7f4b459633696a8ca59118253bc89';

interface AdminOperationResult {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
}

export function useAdminOperations(currentWallet?: string) {
  const [isLoading, setIsLoading] = useState(false);

  const isMasterAdmin = currentWallet?.toLowerCase() === MASTER_ADMIN_WALLET;

  const callAdminOperation = async (
    operation: 'add_admin' | 'remove_admin' | 'update_role' | 'update_config',
    params: {
      wallet_address?: string;
      role?: 'admin' | 'moderator' | 'user';
      config_id?: string;
      config_value?: unknown;
    }
  ): Promise<AdminOperationResult> => {
    if (!currentWallet) {
      return { success: false, error: 'Wallet not connected', code: 'NO_WALLET' };
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { operation, ...params },
        headers: {
          'x-wallet-address': currentWallet.toLowerCase(),
        },
      });

      if (error) {
        console.error('Admin operation error:', error);
        return { success: false, error: error.message || 'Operation failed' };
      }

      return data as AdminOperationResult;
    } catch (err) {
      console.error('Admin operation exception:', err);
      return { success: false, error: 'Operation failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const addAdmin = async (walletAddress: string) => {
    const result = await callAdminOperation('add_admin', { wallet_address: walletAddress });
    
    if (result.success) {
      toast.success(result.message || 'Admin added');
    } else if (result.code === 'MASTER_ADMIN_REQUIRED') {
      toast.error('Only the Master Admin (platform owner) can add new administrators');
    } else {
      toast.error(result.error || 'Failed to add admin');
    }
    
    return result;
  };

  const removeAdmin = async (walletAddress: string) => {
    const result = await callAdminOperation('remove_admin', { wallet_address: walletAddress });
    
    if (result.success) {
      toast.success(result.message || 'Admin removed');
    } else if (result.code === 'MASTER_ADMIN_REQUIRED') {
      toast.error('Only the Master Admin can remove administrators');
    } else {
      toast.error(result.error || 'Failed to remove admin');
    }
    
    return result;
  };

  const updateRole = async (walletAddress: string, role: 'admin' | 'moderator' | 'user') => {
    const result = await callAdminOperation('update_role', { wallet_address: walletAddress, role });
    
    if (result.success) {
      toast.success(result.message || 'Role updated');
    } else if (result.code === 'MASTER_ADMIN_REQUIRED') {
      toast.error('Only the Master Admin can grant admin role');
    } else {
      toast.error(result.error || 'Failed to update role');
    }
    
    return result;
  };

  const updateConfig = async (configId: string, configValue: unknown) => {
    const result = await callAdminOperation('update_config', { config_id: configId, config_value: configValue });
    
    if (result.success) {
      toast.success(result.message || 'Config updated');
    } else if (result.code === 'MASTER_ADMIN_REQUIRED') {
      toast.error('Only the Master Admin can modify platform configuration');
    } else {
      toast.error(result.error || 'Failed to update config');
    }
    
    return result;
  };

  return {
    isMasterAdmin,
    isLoading,
    addAdmin,
    removeAdmin,
    updateRole,
    updateConfig,
  };
}
