import { useState, useEffect, useCallback } from 'react';
import { 
  EIP6963ProviderDetail, 
  EIP6963AnnounceProviderEvent,
  EIP1193Provider,
  KNOWN_WALLETS 
} from '@/types/wallet';

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: EIP1193Provider & {
      isMetaMask?: boolean;
    };
  }
}

export function useWalletProviders() {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const detectedProviders: EIP6963ProviderDetail[] = [];

    const handleAnnounceProvider = (event: Event) => {
      const { detail } = event as EIP6963AnnounceProviderEvent;
      
      // Avoid duplicates
      const exists = detectedProviders.some(
        (p) => p.info.uuid === detail.info.uuid
      );
      
      if (!exists) {
        detectedProviders.push(detail);
        // Sort: OverFlex first, then MetaMask, then others alphabetically
        detectedProviders.sort((a, b) => {
          if (a.info.rdns === KNOWN_WALLETS.OVERFLEX) return -1;
          if (b.info.rdns === KNOWN_WALLETS.OVERFLEX) return 1;
          if (a.info.rdns === KNOWN_WALLETS.METAMASK) return -1;
          if (b.info.rdns === KNOWN_WALLETS.METAMASK) return 1;
          return a.info.name.localeCompare(b.info.name);
        });
        
        setProviders([...detectedProviders]);
      }
    };

    // Listen for wallet announcements
    window.addEventListener('eip6963:announceProvider', handleAnnounceProvider);

    // Request wallets to announce themselves
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // Fallback: Check for window.ethereum if no EIP-6963 providers after timeout
    const fallbackTimeout = setTimeout(() => {
      if (detectedProviders.length === 0 && window.ethereum) {
        // Create a fallback provider detail for legacy wallets
        const fallbackProvider: EIP6963ProviderDetail = {
          info: {
            uuid: 'legacy-ethereum',
            name: window.ethereum.isMetaMask ? 'MetaMask' : 'Browser Wallet',
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjIiIHk9IjQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIxNiIgcng9IjIiLz48cGF0aCBkPSJNMjIgMTBIMiIvPjwvc3ZnPg==',
            rdns: window.ethereum.isMetaMask ? KNOWN_WALLETS.METAMASK : 'unknown.wallet',
          },
          provider: window.ethereum,
        };
        setProviders([fallbackProvider]);
      }
      setIsDetecting(false);
    }, 500);

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleAnnounceProvider);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const getProviderByRdns = useCallback(
    (rdns: string) => providers.find((p) => p.info.rdns === rdns),
    [providers]
  );

  const hasOverFlex = providers.some((p) => p.info.rdns === KNOWN_WALLETS.OVERFLEX);
  const hasMetaMask = providers.some((p) => p.info.rdns === KNOWN_WALLETS.METAMASK);

  return {
    providers,
    isDetecting,
    hasOverFlex,
    hasMetaMask,
    hasAnyWallet: providers.length > 0,
    getProviderByRdns,
  };
}
