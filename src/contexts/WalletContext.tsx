import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useWalletProviders } from '@/hooks/useWalletProviders';
import { EIP6963ProviderDetail } from '@/types/wallet';

interface WalletContextType {
  // State
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  isCorrectNetwork: boolean;
  woverBalance: string;
  error: string | null;
  selectedProvider: EIP6963ProviderDetail | null;
  
  // Providers
  providers: EIP6963ProviderDetail[];
  isDetectingProviders: boolean;
  hasOverFlex: boolean;
  hasMetaMask: boolean;
  hasAnyWallet: boolean;
  
  // Modal
  isModalOpen: boolean;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  
  // Actions
  connect: (provider: EIP6963ProviderDetail) => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const walletProviders = useWalletProviders();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openConnectModal = useCallback(() => setIsModalOpen(true), []);
  const closeConnectModal = useCallback(() => setIsModalOpen(false), []);

  // Auto-reconnect to last used wallet
  useEffect(() => {
    const lastWalletRdns = localStorage.getItem('lastWalletRdns');
    if (lastWalletRdns && !wallet.isConnected && !walletProviders.isDetecting) {
      const provider = walletProviders.getProviderByRdns(lastWalletRdns);
      if (provider) {
        wallet.connect(provider);
      }
    }
  }, [walletProviders.isDetecting, walletProviders.providers]);

  // Close modal on successful connection
  useEffect(() => {
    if (wallet.isConnected) {
      closeConnectModal();
    }
  }, [wallet.isConnected, closeConnectModal]);

  const value: WalletContextType = {
    // Wallet state
    address: wallet.address,
    isConnected: wallet.isConnected,
    isConnecting: wallet.isConnecting,
    chainId: wallet.chainId,
    isCorrectNetwork: wallet.isCorrectNetwork,
    woverBalance: wallet.woverBalance,
    error: wallet.error,
    selectedProvider: wallet.selectedProvider,
    
    // Providers
    providers: walletProviders.providers,
    isDetectingProviders: walletProviders.isDetecting,
    hasOverFlex: walletProviders.hasOverFlex,
    hasMetaMask: walletProviders.hasMetaMask,
    hasAnyWallet: walletProviders.hasAnyWallet,
    
    // Modal
    isModalOpen,
    openConnectModal,
    closeConnectModal,
    
    // Actions
    connect: wallet.connect,
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
