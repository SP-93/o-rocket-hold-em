import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Smartphone, Monitor } from 'lucide-react';
import { EIP6963ProviderDetail, KNOWN_WALLETS, WALLET_DOWNLOAD_LINKS } from '@/types/wallet';
import { cn } from '@/lib/utils';

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providers: EIP6963ProviderDetail[];
  isDetecting: boolean;
  onConnect: (provider: EIP6963ProviderDetail) => void;
  isConnecting: boolean;
}

export function WalletConnectModal({
  open,
  onOpenChange,
  providers,
  isDetecting,
  onConnect,
  isConnecting,
}: WalletConnectModalProps) {
  const { t } = useTranslation();

  const isOverFlex = (rdns: string) => rdns === KNOWN_WALLETS.OVERFLEX;
  const isMetaMask = (rdns: string) => rdns === KNOWN_WALLETS.METAMASK;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-xl">
            {t('wallet.selectWallet')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Detected Wallets */}
          {isDetecting ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : providers.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground px-1">
                {t('wallet.detected')}
              </p>
              {providers.map((provider) => (
                <button
                  key={provider.info.uuid}
                  onClick={() => onConnect(provider)}
                  disabled={isConnecting}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl",
                    "bg-secondary/50 hover:bg-secondary transition-all duration-200",
                    "border border-transparent hover:border-primary/30",
                    "group relative overflow-hidden",
                    isConnecting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {/* Wallet Icon */}
                  <div className="relative h-12 w-12 rounded-xl bg-background/50 p-2 flex items-center justify-center">
                    <img
                      src={provider.info.icon}
                      alt={provider.info.name}
                      className="h-8 w-8 object-contain"
                    />
                  </div>

                  {/* Wallet Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {provider.info.name}
                      </span>
                      {isOverFlex(provider.info.rdns) && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-medium">
                          {t('wallet.recommended')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isOverFlex(provider.info.rdns)
                        ? 'OverProtocol Native Wallet'
                        : isMetaMask(provider.info.rdns)
                        ? 'Popular Ethereum Wallet'
                        : 'EIP-6963 Compatible'}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    <svg
                      className="h-5 w-5 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>

                  {/* Connecting state overlay */}
                  {isConnecting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                {t('wallet.noWallet')}
              </p>
            </div>
          )}

          {/* Divider */}
          {!isDetecting && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {providers.length > 0 ? t('common.or') : t('wallet.getWallet')}
                  </span>
                </div>
              </div>

              {/* Download Links */}
              <div className="grid gap-3">
                {/* OverFlex - Primary */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-xl">🚀</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">OverFlex</h4>
                      <p className="text-xs text-muted-foreground">
                        {t('wallet.recommended')} • OverProtocol Native
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => window.open(WALLET_DOWNLOAD_LINKS.overflex.website, '_blank')}
                    >
                      <Monitor className="h-4 w-4" />
                      Desktop
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => window.open(WALLET_DOWNLOAD_LINKS.overflex.website, '_blank')}
                    >
                      <Smartphone className="h-4 w-4" />
                      Mobile
                    </Button>
                  </div>
                </div>

                {/* MetaMask - Secondary */}
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#F6851B]/20 flex items-center justify-center">
                        <span className="text-sm">🦊</span>
                      </div>
                      <span className="font-medium text-sm">MetaMask</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => window.open(WALLET_DOWNLOAD_LINKS.metamask.website, '_blank')}
                    >
                      {t('wallet.getMetaMask')}
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
