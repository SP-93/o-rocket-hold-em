import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

// OverProtocol Mainnet configuration
const OVER_PROTOCOL_CHAIN = {
  chainId: '0xD3A0', // 54176 in hex
  chainName: 'OverProtocol Mainnet',
  nativeCurrency: {
    name: 'OVER',
    symbol: 'OVER',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.mainnet.overprotocol.com'],
  blockExplorerUrls: ['https://scan.overprotocol.com'],
};

// WOVER token address on OverProtocol
const WOVER_ADDRESS = '0x0000000000000000000000000000000000000000'; // Replace with actual WOVER address

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  isCorrectNetwork: boolean;
  woverBalance: string;
  error: string | null;
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
  });

  const updateBalance = useCallback(async (address: string) => {
    try {
      if (!window.ethereum) return;
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.utils.formatEther(balance);
      
      setState(prev => ({
        ...prev,
        woverBalance: parseFloat(formattedBalance).toFixed(4),
      }));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();
      const network = await provider.getNetwork();

      if (accounts.length > 0) {
        const address = accounts[0];
        const isCorrectNetwork = network.chainId === 54176;

        setState(prev => ({
          ...prev,
          address,
          isConnected: true,
          chainId: network.chainId,
          isCorrectNetwork,
        }));

        if (isCorrectNetwork) {
          await updateBalance(address);
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  }, [updateBalance]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({
        ...prev,
        error: 'MetaMask not installed',
      }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();

      const address = accounts[0];
      const isCorrectNetwork = network.chainId === 54176;

      setState(prev => ({
        ...prev,
        address,
        isConnected: true,
        isConnecting: false,
        chainId: network.chainId,
        isCorrectNetwork,
      }));

      if (isCorrectNetwork) {
        await updateBalance(address);
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
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
      isCorrectNetwork: false,
      woverBalance: '0',
      error: null,
    });
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: OVER_PROTOCOL_CHAIN.chainId }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [OVER_PROTOCOL_CHAIN],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      }
    }
  }, []);

  // Listen for account and network changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setState(prev => ({
          ...prev,
          address: accounts[0],
        }));
        updateBalance(accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      const numericChainId = parseInt(chainId, 16);
      setState(prev => ({
        ...prev,
        chainId: numericChainId,
        isCorrectNetwork: numericChainId === 54176,
      }));
      
      if (numericChainId === 54176 && state.address) {
        updateBalance(state.address);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Check initial connection
    checkConnection();

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [checkConnection, disconnect, updateBalance, state.address]);

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    hasMetaMask: typeof window !== 'undefined' && !!window.ethereum,
  };
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
