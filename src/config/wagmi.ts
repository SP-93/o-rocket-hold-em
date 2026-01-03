import { http, createConfig } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { defineChain } from 'viem';

// Over Protocol Mainnet Chain Definition
export const overProtocol = defineChain({
  id: 54176,
  name: 'OverProtocol Mainnet',
  nativeCurrency: {
    name: 'OVER',
    symbol: 'OVER',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.overprotocol.com/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Over Scan',
      url: 'https://scan.over.network',
    },
  },
});

// WalletConnect Project ID (public key - safe to expose)
export const WALLETCONNECT_PROJECT_ID = '664dcc03f0df47cb7978c8b12da7bf40';

// Wagmi config
export const wagmiConfig = createConfig({
  chains: [overProtocol],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'O\'Poker',
        description: 'Decentralized Poker on OverProtocol',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: ['https://over.network/favicon.ico'],
      },
      showQrModal: false, // Web3Modal will handle this
    }),
  ],
  transports: {
    [overProtocol.id]: http(),
  },
});

// Chain ID for network checks
export const OVER_CHAIN_ID = 54176;
