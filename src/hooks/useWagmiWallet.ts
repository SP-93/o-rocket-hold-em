import { useAccount, useBalance, useChainId, useSwitchChain, useDisconnect, useConnect } from 'wagmi';
import { useCallback, useMemo } from 'react';
import { OVER_CHAIN_ID, overProtocol } from '@/config/wagmi';
import { formatUnits } from 'viem';

export function useWagmiWallet() {
  const { address, isConnected, isConnecting, connector } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { connectors, connect } = useConnect();

  // Fetch native OVER balance
  const { data: balanceData } = useBalance({
    address,
    chainId: OVER_CHAIN_ID,
  });

  const isCorrectNetwork = chainId === OVER_CHAIN_ID;

  const woverBalance = useMemo(() => {
    if (!balanceData) return '0';
    return parseFloat(formatUnits(balanceData.value, balanceData.decimals)).toFixed(4);
  }, [balanceData]);

  const switchNetwork = useCallback(async () => {
    try {
      switchChain({ chainId: OVER_CHAIN_ID });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  }, [switchChain]);

  const disconnect = useCallback(() => {
    localStorage.removeItem('lastConnectorId');
    wagmiDisconnect();
  }, [wagmiDisconnect]);

  // Get connector info for display
  const connectorInfo = useMemo(() => {
    if (!connector) return null;
    return {
      name: connector.name,
      icon: connector.icon,
    };
  }, [connector]);

  return {
    // State
    address: address ?? null,
    isConnected,
    isConnecting,
    chainId,
    isCorrectNetwork,
    woverBalance,
    
    // Connector info
    connectorInfo,
    connectors,
    
    // Actions
    connect,
    disconnect,
    switchNetwork,
  };
}
