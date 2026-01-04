import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useUserWallets } from '@/hooks/useUserWallets';
import { useWalletContext } from '@/contexts/WalletContext';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Star, 
  StarOff, 
  Edit2, 
  Check, 
  X, 
  Loader2,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WalletSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { 
    wallets, 
    primaryWallet, 
    isLoading, 
    connectWallet, 
    disconnectWallet, 
    setPrimaryWallet,
    updateWalletLabel 
  } = useUserWallets();
  
  const { address: connectedAddress, isConnected, openConnectModal } = useWalletContext();

  const [isConnecting, setIsConnecting] = useState(false);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleConnectWallet = async () => {
    if (!connectedAddress) {
      openConnectModal();
      return;
    }

    setIsConnecting(true);
    
    // In a real implementation, we would ask the wallet to sign a message
    // For now, we'll just connect with a placeholder signature
    const result = await connectWallet(connectedAddress, 'signature_placeholder', 'My Wallet');
    
    setIsConnecting(false);

    if (result.success) {
      toast({
        title: 'Wallet connected',
        description: 'Your wallet has been linked to your account.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to connect wallet',
        description: result.error,
      });
    }
  };

  const handleSetPrimary = async (walletId: string) => {
    const result = await setPrimaryWallet(walletId);
    
    if (result.success) {
      toast({
        title: 'Primary wallet updated',
        description: 'Your primary wallet has been changed.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to update primary wallet',
        description: result.error,
      });
    }
  };

  const handleDisconnect = async (walletId: string) => {
    const result = await disconnectWallet(walletId);
    setDeleteConfirmId(null);
    
    if (result.success) {
      toast({
        title: 'Wallet disconnected',
        description: 'The wallet has been removed from your account.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to disconnect wallet',
        description: result.error,
      });
    }
  };

  const handleUpdateLabel = async (walletId: string) => {
    const result = await updateWalletLabel(walletId, editLabel);
    setEditingWalletId(null);
    
    if (result.success) {
      toast({
        title: 'Label updated',
        description: 'Wallet label has been updated.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to update label',
        description: result.error,
      });
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isWalletAlreadyLinked = wallets.some(
    w => w.wallet_address.toLowerCase() === connectedAddress?.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-2xl py-8">
        {/* Back button */}
        <Link 
          to="/lobby" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lobby
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-2xl flex items-center gap-3">
                <Wallet className="h-6 w-6 text-primary" />
                Wallet Settings
              </CardTitle>
              <CardDescription>
                Manage your connected wallets. Your primary wallet will be used for on-chain transactions like buying and cashing out chips.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Connected wallets list */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : wallets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No wallets connected yet.</p>
                  <p className="text-sm">Connect a wallet to start playing with real chips.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {wallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50"
                    >
                      <div className="flex-1 min-w-0">
                        {editingWalletId === wallet.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              placeholder="Wallet label"
                              className="h-8"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateLabel(wallet.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingWalletId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {wallet.label || 'Unnamed Wallet'}
                              </span>
                              {wallet.is_primary && (
                                <Badge variant="default" className="text-xs">
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-muted-foreground font-mono">
                                {shortenAddress(wallet.wallet_address)}
                              </span>
                              <a
                                href={`https://scan.overprotocol.com/address/${wallet.wallet_address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {!wallet.is_primary && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSetPrimary(wallet.id)}
                            title="Set as primary"
                          >
                            <StarOff className="h-4 w-4" />
                          </Button>
                        )}
                        {wallet.is_primary && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled
                            title="Primary wallet"
                          >
                            <Star className="h-4 w-4 text-poker-gold fill-poker-gold" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingWalletId(wallet.id);
                            setEditLabel(wallet.label || '');
                          }}
                          title="Edit label"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirmId(wallet.id)}
                          disabled={wallets.length <= 1}
                          title={wallets.length <= 1 ? 'Cannot remove only wallet' : 'Disconnect wallet'}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Connect new wallet button */}
              <div className="pt-4 border-t border-border/50">
                {isConnected && !isWalletAlreadyLinked ? (
                  <Button
                    onClick={handleConnectWallet}
                    disabled={isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Link Connected Wallet ({shortenAddress(connectedAddress!)})
                  </Button>
                ) : isConnected && isWalletAlreadyLinked ? (
                  <p className="text-center text-sm text-muted-foreground">
                    Connected wallet is already linked to your account.
                  </p>
                ) : (
                  <Button onClick={openConnectModal} className="w-full">
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Wallet</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect this wallet? You can always reconnect it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDisconnect(deleteConfirmId)}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
