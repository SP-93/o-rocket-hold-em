import { Card } from '@/types/poker';
import { PlayingCard } from './PlayingCard';
import { cn } from '@/lib/utils';

interface CommunityCardsProps {
  cards: Card[];
  phase: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
}

export function CommunityCards({ cards, phase }: CommunityCardsProps) {
  // Show 5 card slots, fill with actual cards
  const slots = [0, 1, 2, 3, 4];

  return (
    <div className="flex gap-2 justify-center">
      {slots.map((index) => {
        const card = cards[index];
        const isRevealed = card !== undefined;
        const isNewCard = 
          (phase === 'flop' && index < 3) ||
          (phase === 'turn' && index === 3) ||
          (phase === 'river' && index === 4);

        return (
          <div
            key={index}
            className={cn(
              'transition-all duration-300',
              !isRevealed && 'opacity-30'
            )}
          >
            {isRevealed ? (
              <PlayingCard 
                card={card} 
                size="md"
                dealing={isNewCard}
              />
            ) : (
              <div className="w-12 h-16 rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/10" />
            )}
          </div>
        );
      })}
    </div>
  );
}
