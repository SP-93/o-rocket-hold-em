import { Card } from '@/types/poker';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dealing?: boolean;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors = {
  hearts: 'text-card-suit-red',
  diamonds: 'text-card-suit-red',
  clubs: 'text-card-suit-black',
  spades: 'text-card-suit-black',
};

const sizes = {
  sm: 'w-8 h-11 text-xs',
  md: 'w-12 h-16 text-sm',
  lg: 'w-16 h-22 text-base',
};

export function PlayingCard({ 
  card, 
  faceDown = false, 
  size = 'md',
  className,
  dealing = false,
}: PlayingCardProps) {
  if (!card && !faceDown) return null;

  return (
    <div 
      className={cn(
        'relative rounded-md shadow-lg transition-transform duration-300',
        sizes[size],
        dealing && 'animate-card-deal',
        className
      )}
    >
      {faceDown || !card ? (
        // Card back
        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-primary to-primary/60 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-1 rounded border border-primary-foreground/20" />
          <div className="w-3/4 h-3/4 rounded bg-primary/30 flex items-center justify-center">
            <span className="font-display text-primary-foreground/50 text-[8px]">O'R</span>
          </div>
        </div>
      ) : (
        // Card face
        <div className="absolute inset-0 rounded-md bg-chip-white border border-border/50 flex flex-col p-1">
          <div className={cn('font-bold leading-none', suitColors[card.suit])}>
            <span>{card.rank}</span>
            <span className="ml-0.5">{suitSymbols[card.suit]}</span>
          </div>
          <div className={cn(
            'flex-1 flex items-center justify-center',
            suitColors[card.suit],
            size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-3xl'
          )}>
            {suitSymbols[card.suit]}
          </div>
        </div>
      )}
    </div>
  );
}
