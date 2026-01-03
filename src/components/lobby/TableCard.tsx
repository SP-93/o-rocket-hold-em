import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PokerTable } from '@/types/poker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Coins, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableCardProps {
  table: PokerTable;
}

export function TableCard({ table }: TableCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isFull = table.currentPlayers >= table.maxPlayers;
  const isWaiting = table.status === 'waiting';

  const handleJoin = () => {
    navigate(`/table/${table.id}`);
  };

  return (
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
            <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              {table.name}
            </h3>
            <Badge
              variant={isWaiting ? 'secondary' : 'default'}
              className={cn(
                'mt-1',
                isWaiting ? 'bg-poker-gold/20 text-poker-gold border-poker-gold/30' : ''
              )}
            >
              {isWaiting ? t('common.waitingPlayers') : t('common.inProgress')}
            </Badge>
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
          {isFull ? t('common.tableFull') : t('lobby.joinTable')}
        </Button>
      </CardFooter>
    </Card>
  );
}
