import { cn } from '@/lib/utils';

interface PokerCardSVGProps {
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs';
  rank: string;
  className?: string;
  faceDown?: boolean;
}

export function PokerCardSVG({ suit, rank, className, faceDown = false }: PokerCardSVGProps) {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  
  const suitSymbol = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
  }[suit];

  const suitColor = isRed ? 'text-red-600' : 'text-slate-900';
  const suitGlow = isRed ? 'drop-shadow-[0_0_8px_rgba(220,38,38,0.3)]' : 'drop-shadow-[0_0_8px_rgba(15,23,42,0.2)]';

  // Face down card
  if (faceDown) {
    return (
      <div className={cn(
        "relative rounded-xl overflow-hidden shadow-2xl",
        "bg-gradient-to-br from-primary via-primary/90 to-primary/70",
        "border-2 border-primary/50",
        className
      )}>
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 4px,
              rgba(255,255,255,0.1) 4px,
              rgba(255,255,255,0.1) 8px
            )`
          }} />
        </div>
        
        {/* Center emblem */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-poker-gold/30 border border-poker-gold/50 flex items-center justify-center">
            <span className="text-poker-gold text-lg font-bold">♠</span>
          </div>
        </div>
        
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
      </div>
    );
  }

  // Check if it's a face card
  const isFaceCard = ['J', 'Q', 'K'].includes(rank);
  const isAce = rank === 'A';

  return (
    <div className={cn(
      "relative rounded-xl overflow-hidden",
      "bg-gradient-to-br from-slate-50 via-white to-slate-100",
      "border border-slate-200/80",
      "shadow-[0_8px_30px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.08)]",
      className
    )}>
      {/* Card texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }} />
      
      {/* Top shine */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/60 to-transparent" />
      
      {/* Gold edge highlight */}
      <div className="absolute inset-0 rounded-xl border border-poker-gold/20" />
      
      {/* Top left corner */}
      <div className={cn(
        "absolute top-1 left-1.5 flex flex-col items-center leading-none z-10",
        suitColor
      )}>
        <span className={cn(
          "font-display font-black text-sm tracking-tight",
          suitGlow
        )}>
          {rank}
        </span>
        <span className={cn("text-base -mt-0.5", suitGlow)}>{suitSymbol}</span>
      </div>

      {/* Center design */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isAce ? (
          // Ace - Large ornate suit
          <div className={cn("relative", suitColor)}>
            <span className={cn(
              "text-4xl",
              suitGlow,
              "drop-shadow-lg"
            )}>
              {suitSymbol}
            </span>
            {/* Decorative rings around ace */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border border-current opacity-20" />
            </div>
          </div>
        ) : isFaceCard ? (
          // Face cards - Stylized design
          <div className={cn(
            "relative w-full h-full flex items-center justify-center",
            suitColor
          )}>
            {/* Decorative background pattern */}
            <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-poker-gold/10 via-transparent to-poker-gold/5" />
            
            {/* Central figure representation */}
            <div className="relative flex flex-col items-center">
              <span className={cn(
                "text-2xl font-display font-black",
                suitGlow
              )}>
                {rank}
              </span>
              <span className={cn("text-lg -mt-1", suitGlow)}>{suitSymbol}</span>
            </div>
            
            {/* Corner decorations */}
            <div className={cn(
              "absolute top-2 right-2 text-xs opacity-40",
              suitColor
            )}>
              {suitSymbol}
            </div>
            <div className={cn(
              "absolute bottom-2 left-2 text-xs opacity-40 rotate-180",
              suitColor
            )}>
              {suitSymbol}
            </div>
          </div>
        ) : (
          // Number cards - Pip arrangement
          <div className={cn("text-2xl opacity-50", suitColor, suitGlow)}>
            {suitSymbol}
          </div>
        )}
      </div>

      {/* Bottom right corner (rotated) */}
      <div className={cn(
        "absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180 z-10",
        suitColor
      )}>
        <span className={cn(
          "font-display font-black text-sm tracking-tight",
          suitGlow
        )}>
          {rank}
        </span>
        <span className={cn("text-base -mt-0.5", suitGlow)}>{suitSymbol}</span>
      </div>
      
      {/* Bottom shadow for 3D effect */}
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-slate-200/30 to-transparent" />
    </div>
  );
}
