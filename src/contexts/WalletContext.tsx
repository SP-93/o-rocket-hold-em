import React, { createContext, useContext, ReactNode, useCallback, useState } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useWagmiWallet } from '@/hooks/useWagmiWallet';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';
import { UsernameModal } from '@/components/UsernameModal';

interface WalletContextType {
  // State
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | undefined;
  isCorrectNetwork: boolean;
  woverBalance: string;
  
  // Player profile
  username: string | null;
  isAdmin: boolean;
  profileLoading: boolean;
  
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

  // Player profile integration
  const { 
    profile, 
    isAdmin, 
    isLoading: profileLoading, 
    needsUsername,
    createProfile,
    checkUsernameAvailable,
  } = usePlayerProfile(wallet.address);

  const openConnectModal = useCallback(() => {
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
    
    // Player profile
    username: profile?.username ?? null,
    isAdmin,
    profileLoading,
    
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
      
      {/* Username Modal - shows when connected but no profile */}
      <UsernameModal
        open={wallet.isConnected && needsUsername && !profileLoading}
        onSubmit={createProfile}
        checkAvailability={checkUsernameAvailable}
      />
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
