import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { PokerTable, ActionButtons } from '@/components/poker';
import { Card } from '@/types/poker';

// Mock data for demo
const mockPlayers = [
  {
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    displayName: 'You',
    chipStack: 5000,
    cards: [
      { suit: 'hearts' as const, rank: 'A' as const },
      { suit: 'spades' as const, rank: 'K' as const },
    ],
    isTurn: true,
  },
  {
    walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    displayName: 'Player2',
    chipStack: 3200,
    isSmallBlind: true,
    lastAction: 'call' as const,
  },
  null, // Empty seat
  {
    walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
    displayName: 'Dealer_Pro',
    chipStack: 8500,
    isDealer: true,
    cards: [
      { suit: 'clubs' as const, rank: '10' as const },
      { suit: 'diamonds' as const, rank: 'Q' as const },
    ],
    lastAction: 'raise' as const,
  },
  {
    walletAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
    chipStack: 1200,
    isBigBlind: true,
    isFolded: true,
    lastAction: 'fold' as const,
  },
  null, // Empty seat
];

const mockCommunityCards: Card[] = [
  { suit: 'hearts', rank: '7' },
  { suit: 'diamonds', rank: 'J' },
  { suit: 'clubs', rank: '3' },
];

export default function Table() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [phase] = useState<'flop'>('flop');
  const [pot] = useState(1250);

  const handleFold = () => console.log('Fold');
  const handleCheck = () => console.log('Check');
  const handleCall = () => console.log('Call');
  const handleRaise = (amount: number) => console.log('Raise:', amount);
  const handleAllIn = () => console.log('All-in');

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="gap-2 mb-4">
            <Link to="/lobby">
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>

          <h1 className="font-display text-2xl font-bold">
            {t('table.pot')}: Table #{id}
          </h1>
        </div>

        {/* Poker table */}
        <PokerTable
          players={mockPlayers}
          communityCards={mockCommunityCards}
          pot={pot}
          phase={phase}
          maxPlayers={6}
          className="mb-8"
        />

        {/* Action buttons */}
        <div className="max-w-xl mx-auto">
          <ActionButtons
            isPlayerTurn={true}
            currentBet={100}
            playerChips={5000}
            minRaise={200}
            maxRaise={5000}
            canCheck={false}
            onFold={handleFold}
            onCheck={handleCheck}
            onCall={handleCall}
            onRaise={handleRaise}
            onAllIn={handleAllIn}
          />
        </div>
      </main>
    </div>
  );
}
