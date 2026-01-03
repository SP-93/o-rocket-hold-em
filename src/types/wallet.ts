// Over Protocol Chain Configuration
export const OVER_CHAIN_ID = 54176;

// Known wallet identifiers (for future reference)
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
