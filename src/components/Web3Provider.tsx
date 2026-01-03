import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { wagmiConfig, overProtocol } from '@/config/wagmi';

// Create QueryClient for wagmi
const queryClient = new QueryClient();

// Initialize Web3Modal
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

if (projectId) {
  createWeb3Modal({
    wagmiConfig,
    projectId,
    defaultChain: overProtocol,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': 'hsl(142.1 76.2% 36.3%)', // Primary green
      '--w3m-border-radius-master': '12px',
    },
    featuredWalletIds: [], // Let it auto-detect
    includeWalletIds: undefined,
    excludeWalletIds: undefined,
  });
}

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
