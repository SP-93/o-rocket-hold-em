// Poker game types

export interface PokerTable {
  id: string;
  name: string;
  maxPlayers: 5 | 6;
  currentPlayers: number;
  smallBlind: number;
  bigBlind: number;
  avgPot: number;
  status: 'waiting' | 'playing' | 'paused';
  createdAt: Date;
}

export interface Player {
  id: string;
  walletAddress: string;
  chipBalance: number;
  displayName?: string;
  avatar?: string;
  stats: PlayerStats;
}

export interface PlayerStats {
  handsPlayed: number;
  handsWon: number;
  totalWinnings: number;
  biggestPot: number;
}

export interface TableSeat {
  tableId: string;
  seatNumber: number;
  playerId: string | null;
  chipStack: number;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  isTurn: boolean;
  lastAction?: 'fold' | 'check' | 'call' | 'raise' | 'all-in';
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
}

export interface GameState {
  tableId: string;
  phase: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  pot: number;
  communityCards: Card[];
  currentBet: number;
  dealerPosition: number;
  activePlayerSeat: number;
}
