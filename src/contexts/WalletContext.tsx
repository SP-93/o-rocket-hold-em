import React, { createContext, useContext, ReactNode, useCallback, useState } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useWagmiWallet } from '@/hooks/useWagmiWallet';

interface WalletContextType {
  // State
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | undefined;
  isCorrectNetwork: boolean;
  woverBalance: string;
  
  // Connector info
  connectorInfo: { name: string; icon?: string } | null;
  
  // Modal
  isModalOpen: boolean;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  
  // Actions
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWagmiWallet();
  const { open } = useWeb3Modal();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openConnectModal = useCallback(() => {
    // Try Web3Modal first, fallback to state
    try {
      open();
    } catch {
      setIsModalOpen(true);
    }
  }, [open]);

  const closeConnectModal = useCallback(() => setIsModalOpen(false), []);

  const value: WalletContextType = {
    // Wallet state
    address: wallet.address,
    isConnected: wallet.isConnected,
    isConnecting: wallet.isConnecting,
    chainId: wallet.chainId,
    isCorrectNetwork: wallet.isCorrectNetwork,
    woverBalance: wallet.woverBalance,
    
    // Connector info
    connectorInfo: wallet.connectorInfo,
    
    // Modal
    isModalOpen,
    openConnectModal,
    closeConnectModal,
    
    // Actions
    disconnect: wallet.disconnect,
    switchNetwork: wallet.switchNetwork,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}
