import { Card } from '@/types/poker';
import { PlayingCard } from './PlayingCard';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { usePokerSounds } from '@/hooks/usePokerSounds';

interface CommunityCardsProps {
  cards: Card[];
  phase: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
}

export function CommunityCards({ cards, phase }: CommunityCardsProps) {
  const { playSound } = usePokerSounds();
  const prevPhaseRef = useRef(phase);
  const slots = [0, 1, 2, 3, 4];

  // Play sound on phase change
  useEffect(() => {
    if (prevPhaseRef.current !== phase && phase !== 'waiting' && phase !== 'preflop') {
      playSound('turn');
    }
    prevPhaseRef.current = phase;
  }, [phase, playSound]);

  return (
    <div className="flex gap-2 justify-center">
      <AnimatePresence mode="popLayout">
        {slots.map((index) => {
          const card = cards[index];
          const isRevealed = card !== undefined;

          return (
            <motion.div
              key={`slot-${index}`}
              layout
              className={cn(
                'relative',
                !isRevealed && 'opacity-30'
              )}
            >
              {isRevealed ? (
                <PlayingCard 
                  card={card} 
                  size="md"
                  dealing={true}
                  delay={index}
                />
              ) : (
                <motion.div 
                  className="w-12 h-16 rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ delay: index * 0.05 }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
