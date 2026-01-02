import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  EIP6963ProviderDetail, 
  EIP1193Provider,
  OVER_PROTOCOL_CHAIN, 
  OVER_CHAIN_ID 
} from '@/types/wallet';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  isCorrectNetwork: boolean;
  woverBalance: string;
  error: string | null;
  selectedProvider: EIP6963ProviderDetail | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
    isCorrectNetwork: false,
    woverBalance: '0',
    error: null,
    selectedProvider: null,
  });

  const updateBalance = useCallback(async (address: string, provider: EIP1193Provider) => {
    try {
      const ethersProvider = new ethers.providers.Web3Provider(provider as any);
      const balance = await ethersProvider.getBalance(address);
      const formattedBalance = ethers.utils.formatEther(balance);
      
      setState(prev => ({
        ...prev,
        woverBalance: parseFloat(formattedBalance).toFixed(4),
      }));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  }, []);

  const connect = useCallback(async (providerDetail: EIP6963ProviderDetail) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const { provider } = providerDetail;
      const ethersProvider = new ethers.providers.Web3Provider(provider as any);
      
      // Request accounts
      const accounts = await ethersProvider.send('eth_requestAccounts', []);
      const network = await ethersProvider.getNetwork();

      const address = accounts[0];
      const isCorrectNetwork = network.chainId === OVER_CHAIN_ID;

      setState(prev => ({
        ...prev,
        address,
        isConnected: true,
        isConnecting: false,
        chainId: network.chainId,
        isCorrectNetwork,
        selectedProvider: providerDetail,
      }));

      // Save last used wallet
      localStorage.setItem('lastWalletRdns', providerDetail.info.rdns);

      if (isCorrectNetwork) {
        await updateBalance(address, provider);
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect',
      }));
    }
  }, [updateBalance]);

  const disconnect = useCallback(() => {
    localStorage.removeItem('lastWalletRdns');
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
      isCorrectNetwork: false,
      woverBalance: '0',
      error: null,
      selectedProvider: null,
    });
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!state.selectedProvider) return;

    const { provider } = state.selectedProvider;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: OVER_PROTOCOL_CHAIN.chainId }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [OVER_PROTOCOL_CHAIN],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      }
    }
  }, [state.selectedProvider]);

  // Listen for account and network changes
  useEffect(() => {
    if (!state.selectedProvider) return;

    const { provider } = state.selectedProvider;

    const handleAccountsChanged = (accounts: unknown) => {
      const accountsArray = accounts as string[];
      if (accountsArray.length === 0) {
        disconnect();
      } else {
        setState(prev => ({
          ...prev,
          address: accountsArray[0],
        }));
        updateBalance(accountsArray[0], provider);
      }
    };

    const handleChainChanged = (chainId: unknown) => {
      const numericChainId = parseInt(chainId as string, 16);
      const isCorrectNetwork = numericChainId === OVER_CHAIN_ID;
      
      setState(prev => ({
        ...prev,
        chainId: numericChainId,
        isCorrectNetwork,
      }));
      
      if (isCorrectNetwork && state.address) {
        updateBalance(state.address, provider);
      }
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
    };
  }, [state.selectedProvider, state.address, disconnect, updateBalance]);

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
  };
}
