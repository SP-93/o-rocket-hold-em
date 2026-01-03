import { Card } from '@/types/poker';

const SUITS: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Card['rank'][] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Create a fresh 52-card deck
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

// Fisher-Yates shuffle algorithm
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal cards from the deck
export function dealCards(deck: Card[], count: number): { dealt: Card[]; remaining: Card[] } {
  return {
    dealt: deck.slice(0, count),
    remaining: deck.slice(count),
  };
}

// Deal hole cards to multiple players
export function dealHoleCards(
  deck: Card[],
  playerCount: number
): { holeCards: Card[][]; remaining: Card[] } {
  const holeCards: Card[][] = [];
  let remaining = [...deck];
  
  // Deal 2 cards to each player (one at a time, like real poker)
  for (let round = 0; round < 2; round++) {
    for (let player = 0; player < playerCount; player++) {
      if (round === 0) {
        holeCards[player] = [];
      }
      holeCards[player].push(remaining[0]);
      remaining = remaining.slice(1);
    }
  }
  
  return { holeCards, remaining };
}

// Deal community cards (flop, turn, river)
export function dealCommunityCards(
  deck: Card[],
  phase: 'flop' | 'turn' | 'river'
): { cards: Card[]; remaining: Card[] } {
  // Burn a card first
  const afterBurn = deck.slice(1);
  
  let cardCount: number;
  switch (phase) {
    case 'flop':
      cardCount = 3;
      break;
    case 'turn':
    case 'river':
      cardCount = 1;
      break;
    default:
      cardCount = 0;
  }
  
  return {
    cards: afterBurn.slice(0, cardCount),
    remaining: afterBurn.slice(cardCount),
  };
}

// Card to string representation
export function cardToString(card: Card): string {
  const suitSymbols: Record<Card['suit'], string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };
  return `${card.rank}${suitSymbols[card.suit]}`;
}

// Parse card from string
export function parseCard(str: string): Card | null {
  const suitMap: Record<string, Card['suit']> = {
    '♥': 'hearts', 'h': 'hearts', 'H': 'hearts',
    '♦': 'diamonds', 'd': 'diamonds', 'D': 'diamonds',
    '♣': 'clubs', 'c': 'clubs', 'C': 'clubs',
    '♠': 'spades', 's': 'spades', 'S': 'spades',
  };
  
  const match = str.match(/^(10|[2-9JQKA])([♥♦♣♠hdcsHDCS])$/);
  if (!match) return null;
  
  const rank = match[1] as Card['rank'];
  const suit = suitMap[match[2]];
  
  if (!suit || !RANKS.includes(rank)) return null;
  
  return { suit, rank };
}
