import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PokerTable, ActionButtons } from '@/components/poker';
import { usePokerTable } from '@/hooks/usePokerTable';
import { useWallet } from '@/hooks/useWallet';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/types/poker';

export default function Table() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { table, seats, loading, error, joinTable, leaveTable, performAction } = usePokerTable(id || '');
  const { address, isConnected } = useWallet();

  // Find current player's seat
  const playerSeat = seats.find(s => s.player_wallet?.toLowerCase() === address?.toLowerCase());
  const isPlayerTurn = playerSeat?.is_turn || false;

  // Convert seats to player format for PokerTable component
  const players = seats.map(seat => {
    if (!seat.player_wallet) return null;
    return {
      walletAddress: seat.player_wallet,
      displayName: seat.player_name || undefined,
      chipStack: seat.chip_stack,
      cards: seat.cards as Card[],
      isDealer: seat.is_dealer,
      isSmallBlind: seat.is_small_blind,
      isBigBlind: seat.is_big_blind,
      isTurn: seat.is_turn,
      isFolded: seat.is_folded,
      lastAction: seat.last_action || undefined,
    };
  });

  const handleJoinSeat = async (seatNumber: number) => {
    if (!isConnected || !address) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet to join a table',
        variant: 'destructive',
      });
      return;
    }

    const success = await joinTable(seatNumber, address, undefined, 1000);
    if (success) {
      toast({
        title: 'Joined!',
        description: `You joined seat #${seatNumber}`,
      });
    }
  };

  const handleLeave = async () => {
    if (!playerSeat) return;
    const success = await leaveTable(playerSeat.seat_number);
    if (success) {
      toast({
        title: 'Left table',
        description: 'You have left the table',
      });
    }
  };

  const handleFold = () => {
    if (!playerSeat) return;
    performAction(playerSeat.seat_number, 'fold');
  };

  const handleCheck = () => {
    if (!playerSeat) return;
    performAction(playerSeat.seat_number, 'check');
  };

  const handleCall = () => {
    if (!playerSeat) return;
    performAction(playerSeat.seat_number, 'call', table?.current_bet);
  };

  const handleRaise = (amount: number) => {
    if (!playerSeat) return;
    performAction(playerSeat.seat_number, 'raise', amount);
  };

  const handleAllIn = () => {
    if (!playerSeat) return;
    performAction(playerSeat.seat_number, 'all-in');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <p className="text-destructive mb-4">{error || 'Table not found'}</p>
          <Button asChild>
            <Link to="/lobby">Back to Lobby</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="gap-2 mb-4">
              <Link to="/lobby">
                <ArrowLeft className="h-4 w-4" />
                {t('common.back')}
              </Link>
            </Button>

            <h1 className="font-display text-2xl font-bold">
              {table.name}
            </h1>
            <p className="text-muted-foreground">
              Blinds: {table.small_blind}/{table.big_blind} • {seats.filter(s => s.player_wallet).length}/{table.max_players} players
            </p>
          </div>

          {playerSeat && (
            <Button variant="outline" onClick={handleLeave}>
              {t('table.leave')}
            </Button>
          )}
        </div>

        {/* Poker table */}
        <PokerTable
          players={players}
          communityCards={table.community_cards}
          pot={table.pot}
          phase={table.current_phase}
          maxPlayers={table.max_players as 5 | 6}
          className="mb-8"
          onSeatClick={!playerSeat ? handleJoinSeat : undefined}
        />

        {/* Action buttons - only show if player is seated */}
        {playerSeat && (
          <div className="max-w-xl mx-auto">
            <ActionButtons
              isPlayerTurn={isPlayerTurn}
              currentBet={table.current_bet}
              playerChips={playerSeat.chip_stack}
              minRaise={table.big_blind * 2}
              maxRaise={playerSeat.chip_stack}
              canCheck={table.current_bet === 0}
              onFold={handleFold}
              onCheck={handleCheck}
              onCall={handleCall}
              onRaise={handleRaise}
              onAllIn={handleAllIn}
            />
          </div>
        )}

        {/* Join prompt */}
        {!playerSeat && isConnected && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Click an empty seat to join the table</p>
          </div>
        )}

        {!isConnected && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Connect your wallet to join the game</p>
          </div>
        )}
      </main>
    </div>
  );
}
