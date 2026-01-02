// EIP-6963 Types for Multi-Wallet Detection
// https://eips.ethereum.org/EIPS/eip-6963

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string; // Data URI (SVG or PNG)
  rdns: string; // Reverse DNS identifier (e.g., "io.metamask")
}

export interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  detail: EIP6963ProviderDetail;
}

// OverProtocol Mainnet configuration
export const OVER_PROTOCOL_CHAIN = {
  chainId: '0xD3A0', // 54176 in hex
  chainName: 'OverProtocol Mainnet',
  nativeCurrency: {
    name: 'OVER',
    symbol: 'OVER',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.overprotocol.com/'],
  blockExplorerUrls: ['https://scan.over.network/'],
};

export const OVER_CHAIN_ID = 54176;

// Known wallet identifiers
export const KNOWN_WALLETS = {
  OVERFLEX: 'network.over.overflex',
  METAMASK: 'io.metamask',
} as const;

// Download links
export const WALLET_DOWNLOAD_LINKS = {
  overflex: {
    chrome: 'https://chromewebstore.google.com/detail/overflex/your-extension-id',
    ios: 'https://apps.apple.com/app/overflex/id123456789',
    android: 'https://play.google.com/store/apps/details?id=network.over.overflex',
    website: 'https://over.network/overflex',
  },
  metamask: {
    chrome: 'https://metamask.io/download/',
    ios: 'https://apps.apple.com/app/metamask/id1438144202',
    android: 'https://play.google.com/store/apps/details?id=io.metamask',
    website: 'https://metamask.io/download/',
  },
} as const;
