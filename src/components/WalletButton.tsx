import { useTranslation } from 'react-i18next';
import { useWalletContext } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, LogOut, AlertTriangle, ExternalLink } from 'lucide-react';

export function WalletButton() {
  const { t } = useTranslation();
  const {
    address,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    woverBalance,
    hasMetaMask,
    connect,
    disconnect,
    switchNetwork,
  } = useWalletContext();

  // Not installed
  if (!hasMetaMask) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => window.open('https://metamask.io/download/', '_blank')}
      >
        <Wallet className="h-4 w-4" />
        {t('wallet.installMetaMask')}
      </Button>
    );
  }

  // Not connected
  if (!isConnected) {
    return (
      <Button
        onClick={connect}
        disabled={isConnecting}
        className="gap-2 bg-primary hover:bg-primary/90"
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? t('wallet.connecting') : t('wallet.connect')}
      </Button>
    );
  }

  // Wrong network
  if (!isCorrectNetwork) {
    return (
      <Button
        onClick={switchNetwork}
        variant="destructive"
        className="gap-2"
      >
        <AlertTriangle className="h-4 w-4" />
        {t('wallet.switchNetwork')}
      </Button>
    );
  }

  // Connected and correct network
  const shortenedAddress = `${address?.slice(0, 6)}...${address?.slice(-4)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/50">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-sm">{shortenedAddress}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-2">
          <p className="text-xs text-muted-foreground">{t('wallet.woverBalance')}</p>
          <p className="text-lg font-display font-bold text-primary">
            {woverBalance} OVER
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => window.open(`https://scan.overprotocol.com/address/${address}`, '_blank')}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect} className="gap-2 text-destructive">
          <LogOut className="h-4 w-4" />
          {t('common.disconnect')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
