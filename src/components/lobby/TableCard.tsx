import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Coins, TrendingUp, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrivateTableJoinModal } from './PrivateTableJoinModal';
import { useWalletContext } from '@/contexts/WalletContext';
import { toast } from 'sonner';

interface TableCardProps {
  table: {
    id: string;
    name: string;
    maxPlayers: number;
    currentPlayers: number;
    smallBlind: number;
    bigBlind: number;
    status: string;
    avgPot: number;
    isPrivate?: boolean;
  };
}

export function TableCard({ table }: TableCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { address, isConnected } = useWalletContext();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const isFull = table.currentPlayers >= table.maxPlayers;
  const isWaiting = table.status === 'waiting';

  const handleJoin = () => {
    if (!isConnected || !address) {
      toast.error(t('errors.connectWallet'));
      return;
    }

    if (table.isPrivate) {
      setShowPasswordModal(true);
    } else {
      navigate(`/table/${table.id}`);
    }
  };

  const handlePasswordSuccess = () => {
    navigate(`/table/${table.id}`);
  };

  return (
    <>
      <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300">
        {/* Status indicator */}
        <div className="absolute top-0 left-0 right-0 h-1">
          <div
            className={cn(
              'h-full transition-all',
              isWaiting ? 'bg-poker-gold w-full animate-pulse' : 'bg-primary',
              isFull ? 'bg-muted' : ''
            )}
          />
        </div>

        <CardContent className="pt-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {table.name}
                </h3>
                {table.isPrivate && (
                  <Lock className="w-4 h-4 text-poker-gold" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={isWaiting ? 'secondary' : 'default'}
                  className={cn(
                    isWaiting ? 'bg-poker-gold/20 text-poker-gold border-poker-gold/30' : ''
                  )}
                >
                  {isWaiting ? t('common.waitingPlayers') : t('common.inProgress')}
                </Badge>
                {table.isPrivate && (
                  <Badge variant="outline" className="text-xs border-poker-gold/50 text-poker-gold">
                    {t('lobby.filters.private')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-display font-bold text-foreground">
                {table.maxPlayers}
              </span>
              <span className="text-xs text-muted-foreground block">{t('common.max')}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            {/* Players */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">{t('lobby.players')}</span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: table.maxPlayers }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-2 w-2 rounded-full transition-colors',
                      i < table.currentPlayers ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                ))}
                <span className="ml-2 text-sm font-medium">
                  {table.currentPlayers}/{table.maxPlayers}
                </span>
              </div>
            </div>

            {/* Blinds */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Coins className="h-4 w-4" />
                <span className="text-sm">{t('lobby.blinds')}</span>
              </div>
              <span className="text-sm font-medium font-mono">
                {table.smallBlind}/{table.bigBlind}
              </span>
            </div>

            {/* Avg Pot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">{t('lobby.avgPot')}</span>
              </div>
              <span className="text-sm font-medium font-mono text-poker-gold">
                {table.avgPot > 0 ? table.avgPot.toLocaleString() : '-'}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            onClick={handleJoin}
            disabled={isFull}
            className={cn(
              'w-full',
              isFull ? 'opacity-50' : 'glow-primary'
            )}
          >
            {isFull ? t('common.tableFull') : table.isPrivate ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                {t('lobby.joinTable')}
              </>
            ) : t('lobby.joinTable')}
          </Button>
        </CardFooter>
      </Card>

      {/* Private Table Password Modal */}
      {table.isPrivate && address && (
        <PrivateTableJoinModal
          open={showPasswordModal}
          onOpenChange={setShowPasswordModal}
          tableId={table.id}
          tableName={table.name}
          walletAddress={address}
          onSuccess={handlePasswordSuccess}
        />
      )}
    </>
  );
}
