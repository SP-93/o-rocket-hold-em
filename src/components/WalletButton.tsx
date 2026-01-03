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
    connectorInfo,
    openConnectModal,
    disconnect,
    switchNetwork,
  } = useWalletContext();

  // Not connected - show connect button
  if (!isConnected) {
    return (
      <Button
        onClick={openConnectModal}
        disabled={isConnecting}
        className="gap-2 bg-primary hover:bg-primary/90 glow-primary"
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
        <Button variant="outline" className="gap-2 border-primary/50 hover:border-primary">
          {/* Wallet icon from connector */}
          {connectorInfo?.icon ? (
            <img 
              src={connectorInfo.icon} 
              alt={connectorInfo.name}
              className="h-4 w-4 rounded-sm"
            />
          ) : (
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
          <span className="font-mono text-sm">{shortenedAddress}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Wallet name */}
        {connectorInfo && (
          <>
            <div className="px-2 py-1.5">
              <p className="text-xs text-muted-foreground">Connected with</p>
              <p className="text-sm font-medium">{connectorInfo.name}</p>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Balance */}
        <div className="px-2 py-2">
          <p className="text-xs text-muted-foreground">{t('wallet.woverBalance')}</p>
          <p className="text-lg font-display font-bold text-primary">
            {woverBalance} OVER
          </p>
        </div>
        <DropdownMenuSeparator />
        
        {/* Explorer link */}
        <DropdownMenuItem
          onClick={() => window.open(`https://scan.over.network/address/${address}`, '_blank')}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          {t('wallet.viewExplorer')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        
        {/* Disconnect */}
        <DropdownMenuItem onClick={disconnect} className="gap-2 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          {t('common.disconnect')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
