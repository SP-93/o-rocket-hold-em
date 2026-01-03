import { cn } from '@/lib/utils';
import { PlayingCard } from './PlayingCard';
import { Card } from '@/types/poker';
import { User } from 'lucide-react';

interface PlayerSeatProps {
  seatNumber: number;
  player?: {
    displayName?: string;
    walletAddress: string;
    chipStack: number;
    cards?: Card[];
    isDealer?: boolean;
    isSmallBlind?: boolean;
    isBigBlind?: boolean;
    isTurn?: boolean;
    lastAction?: 'fold' | 'check' | 'call' | 'raise' | 'all-in';
    isFolded?: boolean;
  };
  position: { top?: string; bottom?: string; left?: string; right?: string };
  className?: string;
}

function formatAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatChips(chips: number): string {
  if (chips >= 1000000) return `${(chips / 1000000).toFixed(1)}M`;
  if (chips >= 1000) return `${(chips / 1000).toFixed(1)}K`;
  return chips.toString();
}

const actionColors = {
  fold: 'bg-muted text-muted-foreground',
  check: 'bg-chip-blue text-primary-foreground',
  call: 'bg-chip-green text-primary-foreground',
  raise: 'bg-poker-gold text-accent-foreground',
  'all-in': 'bg-poker-red text-primary-foreground',
};

export function PlayerSeat({ seatNumber, player, position, className }: PlayerSeatProps) {
  const isEmpty = !player;

  return (
    <div
      className={cn(
        'absolute flex flex-col items-center gap-1 transition-all duration-300',
        className
      )}
      style={position}
    >
      {/* Player cards */}
      {player?.cards && player.cards.length > 0 && !player.isFolded && (
        <div className="flex gap-0.5 mb-1">
          {player.cards.map((card, i) => (
            <PlayingCard 
              key={i} 
              card={card} 
              size="sm"
              className={cn(
                i === 0 && '-rotate-6',
                i === 1 && 'rotate-6 -ml-2'
              )}
            />
          ))}
        </div>
      )}

      {/* Player seat circle */}
      <div
        className={cn(
          'relative w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300',
          isEmpty 
            ? 'border-dashed border-muted-foreground/30 bg-muted/20' 
            : 'border-primary/50 bg-secondary',
          player?.isTurn && 'ring-2 ring-poker-gold ring-offset-2 ring-offset-background animate-pulse-glow',
          player?.isFolded && 'opacity-50'
        )}
      >
        {isEmpty ? (
          <span className="text-xs text-muted-foreground">#{seatNumber}</span>
        ) : (
          <>
            <User className="w-8 h-8 text-muted-foreground" />
            {/* Dealer button */}
            {player.isDealer && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-chip-white text-card-suit-black text-[10px] font-bold flex items-center justify-center border border-border shadow-md">
                D
              </div>
            )}
            {/* Blind indicator */}
            {(player.isSmallBlind || player.isBigBlind) && (
              <div className={cn(
                'absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-[8px] font-bold flex items-center justify-center border shadow-md',
                player.isSmallBlind ? 'bg-chip-blue text-primary-foreground' : 'bg-poker-gold text-accent-foreground'
              )}>
                {player.isSmallBlind ? 'SB' : 'BB'}
              </div>
            )}
          </>
        )}
      </div>

      {/* Player info */}
      {!isEmpty && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-medium text-foreground truncate max-w-20">
            {player.displayName || formatAddress(player.walletAddress)}
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary border border-border">
            <span className="text-xs font-bold text-poker-gold">
              {formatChips(player.chipStack)}
            </span>
          </div>
          {/* Last action badge */}
          {player.lastAction && (
            <span className={cn(
              'text-[10px] font-medium px-2 py-0.5 rounded-full uppercase',
              actionColors[player.lastAction]
            )}>
              {player.lastAction}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
