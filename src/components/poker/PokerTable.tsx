import { PlayerSeat } from './PlayerSeat';
import { CommunityCards } from './CommunityCards';
import { PotDisplay } from './PotDisplay';
import { Card } from '@/types/poker';
import { cn } from '@/lib/utils';

interface Player {
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
}

interface PokerTableProps {
  players: (Player | null)[];
  communityCards: Card[];
  pot: number;
  phase: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  maxPlayers: 5 | 6;
  className?: string;
  onSeatClick?: (seatNumber: number) => void;
}

// Seat positions for 6-player table (oval layout)
const seatPositions6: { top?: string; bottom?: string; left?: string; right?: string }[] = [
  { bottom: '-10%', left: '50%', transform: 'translateX(-50%)' } as any, // Seat 1 - bottom center (player)
  { bottom: '10%', left: '5%' },   // Seat 2 - bottom left
  { top: '30%', left: '-5%' },     // Seat 3 - left
  { top: '-10%', left: '50%', transform: 'translateX(-50%)' } as any,  // Seat 4 - top center
  { top: '30%', right: '-5%' },    // Seat 5 - right
  { bottom: '10%', right: '5%' },  // Seat 6 - bottom right
];

// Seat positions for 5-player table
const seatPositions5: { top?: string; bottom?: string; left?: string; right?: string }[] = [
  { bottom: '-10%', left: '50%', transform: 'translateX(-50%)' } as any,
  { bottom: '15%', left: '5%' },
  { top: '20%', left: '10%' },
  { top: '20%', right: '10%' },
  { bottom: '15%', right: '5%' },
];

export function PokerTable({
  players,
  communityCards,
  pot,
  phase,
  maxPlayers,
  className,
  onSeatClick,
}: PokerTableProps) {
  const seatPositions = maxPlayers === 6 ? seatPositions6 : seatPositions5;

  return (
    <div className={cn('relative w-full max-w-4xl mx-auto', className)}>
      {/* Table felt */}
      <div className="relative aspect-[16/10] rounded-[100px] poker-felt border-8 border-poker-felt-dark shadow-2xl overflow-visible">
        {/* Inner table rim */}
        <div className="absolute inset-4 rounded-[80px] border-2 border-poker-felt-dark/50" />
        
        {/* Center area - community cards and pot */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <PotDisplay pot={pot} />
          <CommunityCards cards={communityCards} phase={phase} />
        </div>

        {/* Player seats */}
        {seatPositions.map((position, index) => (
          <PlayerSeat
            key={index}
            seatNumber={index + 1}
            player={players[index] || undefined}
            position={position}
            onClick={onSeatClick && !players[index] ? () => onSeatClick(index + 1) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
