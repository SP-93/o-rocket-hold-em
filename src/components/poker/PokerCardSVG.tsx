import { cn } from '@/lib/utils';

interface PokerCardSVGProps {
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs';
  rank: string;
  className?: string;
}

export function PokerCardSVG({ suit, rank, className }: PokerCardSVGProps) {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  
  const suitSymbol = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
  }[suit];

  return (
    <div className={cn(
      "relative rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300/80 shadow-2xl overflow-hidden",
      className
    )}>
      {/* Card inner glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent" />
      
      {/* Top left corner */}
      <div className={cn(
        "absolute top-1.5 left-1.5 flex flex-col items-center leading-none",
        isRed ? "text-red-600" : "text-slate-900"
      )}>
        <span className="font-display font-bold text-base drop-shadow-sm">{rank}</span>
        <span className="text-lg -mt-0.5">{suitSymbol}</span>
      </div>

      {/* Center suit */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center",
        isRed ? "text-red-600" : "text-slate-900"
      )}>
        <span className="text-3xl opacity-40">{suitSymbol}</span>
      </div>

      {/* Bottom right corner (rotated) */}
      <div className={cn(
        "absolute bottom-1.5 right-1.5 flex flex-col items-center leading-none rotate-180",
        isRed ? "text-red-600" : "text-slate-900"
      )}>
        <span className="font-display font-bold text-base drop-shadow-sm">{rank}</span>
        <span className="text-lg -mt-0.5">{suitSymbol}</span>
      </div>
    </div>
  );
}
