import { Card } from '@/types/poker';
import { createDeck, shuffleDeck, dealHoleCards, dealCommunityCards } from './deck';
import { evaluateHand, findWinners, HandResult } from './handEvaluator';

export type GamePhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface PlayerState {
  seatNumber: number;
  walletAddress: string;
  chipStack: number;
  holeCards: Card[];
  currentBet: number;
  isFolded: boolean;
  isAllIn: boolean;
  lastAction: 'fold' | 'check' | 'call' | 'raise' | 'all-in' | null;
}

export interface GameState {
  tableId: string;
  phase: GamePhase;
  deck: Card[];
  communityCards: Card[];
  pot: number;
  sidePots: { amount: number; eligibleSeats: number[] }[];
  currentBet: number;
  minRaise: number;
  dealerPosition: number;
  activePlayerSeat: number | null;
  players: PlayerState[];
  lastRaiser: number | null;
  roundComplete: boolean;
}

// Initialize a new game state
export function createGameState(
  tableId: string,
  players: { seatNumber: number; walletAddress: string; chipStack: number }[],
  dealerPosition: number,
  smallBlind: number,
  bigBlind: number
): GameState {
  const deck = shuffleDeck(createDeck());
  const { holeCards, remaining } = dealHoleCards(deck, players.length);
  
  // Assign hole cards to players
  const playerStates: PlayerState[] = players.map((p, i) => ({
    seatNumber: p.seatNumber,
    walletAddress: p.walletAddress,
    chipStack: p.chipStack,
    holeCards: holeCards[i],
    currentBet: 0,
    isFolded: false,
    isAllIn: false,
    lastAction: null,
  }));
  
  // Find small and big blind positions
  const sortedSeats = [...playerStates].sort((a, b) => a.seatNumber - b.seatNumber);
  const dealerIdx = sortedSeats.findIndex(p => p.seatNumber === dealerPosition);
  const sbIdx = (dealerIdx + 1) % sortedSeats.length;
  const bbIdx = (dealerIdx + 2) % sortedSeats.length;
  const utgIdx = (dealerIdx + 3) % sortedSeats.length;
  
  // Post blinds
  const sbPlayer = sortedSeats[sbIdx];
  const bbPlayer = sortedSeats[bbIdx];
  
  const sbAmount = Math.min(smallBlind, sbPlayer.chipStack);
  const bbAmount = Math.min(bigBlind, bbPlayer.chipStack);
  
  sbPlayer.chipStack -= sbAmount;
  sbPlayer.currentBet = sbAmount;
  if (sbPlayer.chipStack === 0) sbPlayer.isAllIn = true;
  
  bbPlayer.chipStack -= bbAmount;
  bbPlayer.currentBet = bbAmount;
  if (bbPlayer.chipStack === 0) bbPlayer.isAllIn = true;
  
  return {
    tableId,
    phase: 'preflop',
    deck: remaining,
    communityCards: [],
    pot: sbAmount + bbAmount,
    sidePots: [],
    currentBet: bigBlind,
    minRaise: bigBlind,
    dealerPosition,
    activePlayerSeat: sortedSeats[utgIdx].seatNumber,
    players: playerStates,
    lastRaiser: bbPlayer.seatNumber,
    roundComplete: false,
  };
}

// Get the next active player
function getNextActivePlayer(state: GameState, currentSeat: number): number | null {
  const activePlayers = state.players.filter(p => !p.isFolded && !p.isAllIn);
  if (activePlayers.length === 0) return null;
  
  const sortedSeats = activePlayers.map(p => p.seatNumber).sort((a, b) => a - b);
  const currentIdx = sortedSeats.indexOf(currentSeat);
  
  if (currentIdx === -1) {
    // Current player is not in active list, find next closest
    const nextSeat = sortedSeats.find(s => s > currentSeat) || sortedSeats[0];
    return nextSeat;
  }
  
  const nextIdx = (currentIdx + 1) % sortedSeats.length;
  return sortedSeats[nextIdx];
}

// Check if betting round is complete
function isBettingRoundComplete(state: GameState): boolean {
  const activePlayers = state.players.filter(p => !p.isFolded && !p.isAllIn);
  
  // Only one player left (everyone else folded or all-in)
  if (activePlayers.length <= 1) return true;
  
  // All active players have matched the current bet
  const allMatched = activePlayers.every(p => p.currentBet === state.currentBet);
  
  // And everyone has acted at least once (lastAction is not null)
  const allActed = activePlayers.every(p => p.lastAction !== null);
  
  // And we've gone around to the last raiser
  if (allMatched && allActed) {
    if (state.lastRaiser === null) return true;
    return state.activePlayerSeat === state.lastRaiser;
  }
  
  return false;
}

// Process a player action
export function processAction(
  state: GameState,
  seatNumber: number,
  action: 'fold' | 'check' | 'call' | 'raise' | 'all-in',
  raiseAmount?: number
): GameState {
  const newState = { ...state, players: state.players.map(p => ({ ...p })) };
  const player = newState.players.find(p => p.seatNumber === seatNumber);
  
  if (!player || player.isFolded || player.isAllIn) {
    return state;
  }
  
  switch (action) {
    case 'fold':
      player.isFolded = true;
      player.lastAction = 'fold';
      break;
      
    case 'check':
      if (player.currentBet < newState.currentBet) {
        return state; // Invalid check
      }
      player.lastAction = 'check';
      break;
      
    case 'call': {
      const toCall = newState.currentBet - player.currentBet;
      const actualCall = Math.min(toCall, player.chipStack);
      player.chipStack -= actualCall;
      player.currentBet += actualCall;
      newState.pot += actualCall;
      player.lastAction = 'call';
      if (player.chipStack === 0) player.isAllIn = true;
      break;
    }
      
    case 'raise': {
      const raiseTotal = raiseAmount || (newState.currentBet + newState.minRaise);
      const toAdd = raiseTotal - player.currentBet;
      
      if (toAdd > player.chipStack) {
        return state; // Invalid raise
      }
      
      player.chipStack -= toAdd;
      player.currentBet = raiseTotal;
      newState.pot += toAdd;
      newState.currentBet = raiseTotal;
      newState.minRaise = raiseTotal - newState.currentBet + newState.minRaise;
      newState.lastRaiser = seatNumber;
      player.lastAction = 'raise';
      break;
    }
      
    case 'all-in': {
      const allInAmount = player.chipStack;
      newState.pot += allInAmount;
      player.currentBet += allInAmount;
      player.chipStack = 0;
      player.isAllIn = true;
      player.lastAction = 'all-in';
      
      if (player.currentBet > newState.currentBet) {
        newState.currentBet = player.currentBet;
        newState.lastRaiser = seatNumber;
      }
      break;
    }
  }
  
  // Move to next player
  const nextPlayer = getNextActivePlayer(newState, seatNumber);
  newState.activePlayerSeat = nextPlayer;
  
  // Check if betting round is complete
  if (isBettingRoundComplete(newState)) {
    newState.roundComplete = true;
  }
  
  return newState;
}

// Advance to the next phase
export function advancePhase(state: GameState): GameState {
  const newState = { ...state, players: state.players.map(p => ({ ...p })) };
  
  // Reset betting for new round
  for (const player of newState.players) {
    player.currentBet = 0;
    player.lastAction = null;
  }
  newState.currentBet = 0;
  newState.lastRaiser = null;
  newState.roundComplete = false;
  
  // Deal community cards based on phase
  switch (newState.phase) {
    case 'preflop': {
      const { cards, remaining } = dealCommunityCards(newState.deck, 'flop');
      newState.communityCards = cards;
      newState.deck = remaining;
      newState.phase = 'flop';
      break;
    }
    case 'flop': {
      const { cards, remaining } = dealCommunityCards(newState.deck, 'turn');
      newState.communityCards = [...newState.communityCards, ...cards];
      newState.deck = remaining;
      newState.phase = 'turn';
      break;
    }
    case 'turn': {
      const { cards, remaining } = dealCommunityCards(newState.deck, 'river');
      newState.communityCards = [...newState.communityCards, ...cards];
      newState.deck = remaining;
      newState.phase = 'river';
      break;
    }
    case 'river':
      newState.phase = 'showdown';
      break;
  }
  
  // Set first active player (first after dealer who can act)
  const activePlayers = newState.players.filter(p => !p.isFolded && !p.isAllIn);
  if (activePlayers.length > 0) {
    const sortedSeats = activePlayers.map(p => p.seatNumber).sort((a, b) => a - b);
    const dealerIdx = sortedSeats.findIndex(s => s > newState.dealerPosition);
    newState.activePlayerSeat = dealerIdx !== -1 ? sortedSeats[dealerIdx] : sortedSeats[0];
  }
  
  return newState;
}

// Determine winners at showdown
export function determineWinners(state: GameState): {
  winners: { seatNumber: number; amount: number; hand: HandResult }[];
  results: { seatNumber: number; hand: HandResult }[];
} {
  const showdownPlayers = state.players
    .filter(p => !p.isFolded)
    .map(p => ({
      seatNumber: p.seatNumber,
      holeCards: p.holeCards,
      communityCards: state.communityCards,
    }));
  
  const results = showdownPlayers.map(p => ({
    seatNumber: p.seatNumber,
    hand: evaluateHand(p.holeCards, p.communityCards),
  }));
  
  const winnerResults = findWinners(showdownPlayers);
  const potPerWinner = Math.floor(state.pot / winnerResults.length);
  
  const winners = winnerResults.map(w => ({
    seatNumber: w.seatNumber,
    amount: potPerWinner,
    hand: w.hand,
  }));
  
  return { winners, results };
}

// Check if game should end early (all but one folded)
export function checkEarlyWin(state: GameState): {
  winner: PlayerState;
  amount: number;
} | null {
  const remaining = state.players.filter(p => !p.isFolded);
  if (remaining.length === 1) {
    return {
      winner: remaining[0],
      amount: state.pot,
    };
  }
  return null;
}
