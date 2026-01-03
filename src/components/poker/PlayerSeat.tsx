import { cn } from '@/lib/utils';
import { PlayingCard } from './PlayingCard';
import { Card } from '@/types/poker';
import { User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  onClick?: () => void;
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

const actionAnimations = {
  fold: { opacity: 0.5, scale: 0.95, rotate: -5 },
  check: { scale: 1 },
  call: { scale: 1.02 },
  raise: { scale: 1.05, y: -5 },
  'all-in': { scale: 1.1, y: -10 },
};

export function PlayerSeat({ seatNumber, player, position, className, onClick }: PlayerSeatProps) {
  const isEmpty = !player;

  return (
    <motion.div
      className={cn(
        'absolute flex flex-col items-center gap-1',
        isEmpty && onClick && 'cursor-pointer',
        className
      )}
      style={position}
      onClick={isEmpty && onClick ? onClick : undefined}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        ...(player?.lastAction ? actionAnimations[player.lastAction] : {})
      }}
      whileHover={isEmpty && onClick ? { scale: 1.1 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Player cards */}
      <AnimatePresence>
        {player?.cards && player.cards.length > 0 && !player.isFolded && (
          <motion.div 
            className="flex gap-0.5 mb-1"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0, rotate: 45 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {player.cards.map((card, i) => (
              <PlayingCard 
                key={i} 
                card={card} 
                size="sm"
                dealing={true}
                delay={i}
                className={cn(
                  i === 0 && '-rotate-6',
                  i === 1 && 'rotate-6 -ml-2'
                )}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player seat circle */}
      <motion.div
        className={cn(
          'relative w-16 h-16 rounded-full border-2 flex items-center justify-center',
          isEmpty 
            ? 'border-dashed border-muted-foreground/30 bg-muted/20' 
            : 'border-primary/50 bg-secondary',
          player?.isTurn && 'ring-2 ring-poker-gold ring-offset-2 ring-offset-background',
          player?.isFolded && 'opacity-50'
        )}
        animate={player?.isTurn ? {
          boxShadow: [
            '0 0 0 0 rgba(212, 175, 55, 0)',
            '0 0 20px 10px rgba(212, 175, 55, 0.3)',
            '0 0 0 0 rgba(212, 175, 55, 0)',
          ]
        } : {}}
        transition={player?.isTurn ? {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        } : {}}
      >
        {isEmpty ? (
          <span className="text-xs text-muted-foreground">#{seatNumber}</span>
        ) : (
          <>
            <User className="w-8 h-8 text-muted-foreground" />
            {/* Dealer button */}
            <AnimatePresence>
              {player.isDealer && (
                <motion.div 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-chip-white text-card-suit-black text-[10px] font-bold flex items-center justify-center border border-border shadow-md"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  D
                </motion.div>
              )}
            </AnimatePresence>
            {/* Blind indicator */}
            <AnimatePresence>
              {(player.isSmallBlind || player.isBigBlind) && (
                <motion.div 
                  className={cn(
                    'absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-[8px] font-bold flex items-center justify-center border shadow-md',
                    player.isSmallBlind ? 'bg-chip-blue text-primary-foreground' : 'bg-poker-gold text-accent-foreground'
                  )}
                  initial={{ scale: 0, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, y: 10 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  {player.isSmallBlind ? 'SB' : 'BB'}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>

      {/* Player info */}
      <AnimatePresence>
        {!isEmpty && (
          <motion.div 
            className="flex flex-col items-center gap-0.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <span className="text-xs font-medium text-foreground truncate max-w-20">
              {player.displayName || formatAddress(player.walletAddress)}
            </span>
            <motion.div 
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary border border-border"
              whileHover={{ scale: 1.05 }}
            >
              <motion.span 
                className="text-xs font-bold text-poker-gold"
                key={player.chipStack}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {formatChips(player.chipStack)}
              </motion.span>
            </motion.div>
            {/* Last action badge */}
            <AnimatePresence mode="wait">
              {player.lastAction && (
                <motion.span 
                  key={player.lastAction}
                  className={cn(
                    'text-[10px] font-medium px-2 py-0.5 rounded-full uppercase',
                    actionColors[player.lastAction]
                  )}
                  initial={{ opacity: 0, scale: 0.5, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 10 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  {player.lastAction}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
