import { Card } from '@/types/poker';

// Hand rankings from highest to lowest
export enum HandRank {
  ROYAL_FLUSH = 10,
  STRAIGHT_FLUSH = 9,
  FOUR_OF_A_KIND = 8,
  FULL_HOUSE = 7,
  FLUSH = 6,
  STRAIGHT = 5,
  THREE_OF_A_KIND = 4,
  TWO_PAIR = 3,
  ONE_PAIR = 2,
  HIGH_CARD = 1,
}

export interface HandResult {
  rank: HandRank;
  name: string;
  cards: Card[]; // Best 5 cards
  value: number; // Numeric value for comparison
}

// Rank values for comparison
const RANK_VALUES: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;

// Get numeric value of a card rank
function getRankValue(rank: string): number {
  return RANK_VALUES[rank] || 0;
}

// Sort cards by rank (descending)
function sortByRank(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));
}

// Group cards by rank
function groupByRank(cards: Card[]): Map<string, Card[]> {
  const groups = new Map<string, Card[]>();
  for (const card of cards) {
    const existing = groups.get(card.rank) || [];
    existing.push(card);
    groups.set(card.rank, existing);
  }
  return groups;
}

// Group cards by suit
function groupBySuit(cards: Card[]): Map<string, Card[]> {
  const groups = new Map<string, Card[]>();
  for (const card of cards) {
    const existing = groups.get(card.suit) || [];
    existing.push(card);
    groups.set(card.suit, existing);
  }
  return groups;
}

// Check for flush (5+ cards of same suit)
function findFlush(cards: Card[]): Card[] | null {
  const suitGroups = groupBySuit(cards);
  for (const [, suited] of suitGroups) {
    if (suited.length >= 5) {
      return sortByRank(suited).slice(0, 5);
    }
  }
  return null;
}

// Check for straight (5 consecutive cards)
function findStraight(cards: Card[]): Card[] | null {
  const uniqueRanks = new Map<number, Card>();
  for (const card of cards) {
    const value = getRankValue(card.rank);
    if (!uniqueRanks.has(value)) {
      uniqueRanks.set(value, card);
    }
  }
  
  // Add Ace as low (value 1) for wheel straight
  const aceCard = cards.find(c => c.rank === 'A');
  if (aceCard && !uniqueRanks.has(1)) {
    uniqueRanks.set(1, aceCard);
  }
  
  const values = Array.from(uniqueRanks.keys()).sort((a, b) => b - a);
  
  for (let i = 0; i <= values.length - 5; i++) {
    let isSequence = true;
    const straightCards: Card[] = [];
    
    for (let j = 0; j < 5; j++) {
      const expectedValue = values[i] - j;
      if (values[i + j] !== expectedValue) {
        isSequence = false;
        break;
      }
      straightCards.push(uniqueRanks.get(values[i + j])!);
    }
    
    if (isSequence) {
      return straightCards;
    }
  }
  
  return null;
}

// Check for straight flush
function findStraightFlush(cards: Card[]): Card[] | null {
  const suitGroups = groupBySuit(cards);
  for (const [, suited] of suitGroups) {
    if (suited.length >= 5) {
      const straight = findStraight(suited);
      if (straight) return straight;
    }
  }
  return null;
}

// Calculate hand value for comparison
function calculateHandValue(rank: HandRank, cards: Card[]): number {
  // Base value from hand rank (multiplied by large number)
  let value = rank * 100000000;
  
  // Add card values for tiebreaker
  for (let i = 0; i < Math.min(5, cards.length); i++) {
    value += getRankValue(cards[i].rank) * Math.pow(15, 4 - i);
  }
  
  return value;
}

// Evaluate the best 5-card hand from 7 cards
export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const allCards = [...holeCards, ...communityCards];
  
  if (allCards.length < 5) {
    return {
      rank: HandRank.HIGH_CARD,
      name: 'High Card',
      cards: sortByRank(allCards).slice(0, 5),
      value: 0,
    };
  }
  
  const sorted = sortByRank(allCards);
  const rankGroups = groupByRank(allCards);
  
  // Check for straight flush / royal flush
  const straightFlush = findStraightFlush(allCards);
  if (straightFlush) {
    const isRoyal = getRankValue(straightFlush[0].rank) === 14;
    return {
      rank: isRoyal ? HandRank.ROYAL_FLUSH : HandRank.STRAIGHT_FLUSH,
      name: isRoyal ? 'Royal Flush' : 'Straight Flush',
      cards: straightFlush,
      value: calculateHandValue(
        isRoyal ? HandRank.ROYAL_FLUSH : HandRank.STRAIGHT_FLUSH,
        straightFlush
      ),
    };
  }
  
  // Check for four of a kind
  for (const [, group] of rankGroups) {
    if (group.length === 4) {
      const kickers = sorted.filter(c => c.rank !== group[0].rank).slice(0, 1);
      const cards = [...group, ...kickers];
      return {
        rank: HandRank.FOUR_OF_A_KIND,
        name: 'Four of a Kind',
        cards,
        value: calculateHandValue(HandRank.FOUR_OF_A_KIND, cards),
      };
    }
  }
  
  // Check for full house
  const threeOfAKind: Card[] = [];
  const pairs: Card[][] = [];
  
  for (const [, group] of rankGroups) {
    if (group.length === 3 && threeOfAKind.length === 0) {
      threeOfAKind.push(...group);
    } else if (group.length >= 2) {
      pairs.push(group.slice(0, 2));
    }
  }
  
  if (threeOfAKind.length === 3 && pairs.length > 0) {
    const bestPair = pairs.sort((a, b) => 
      getRankValue(b[0].rank) - getRankValue(a[0].rank)
    )[0];
    const cards = [...threeOfAKind, ...bestPair];
    return {
      rank: HandRank.FULL_HOUSE,
      name: 'Full House',
      cards,
      value: calculateHandValue(HandRank.FULL_HOUSE, cards),
    };
  }
  
  // Check for flush
  const flush = findFlush(allCards);
  if (flush) {
    return {
      rank: HandRank.FLUSH,
      name: 'Flush',
      cards: flush,
      value: calculateHandValue(HandRank.FLUSH, flush),
    };
  }
  
  // Check for straight
  const straight = findStraight(allCards);
  if (straight) {
    return {
      rank: HandRank.STRAIGHT,
      name: 'Straight',
      cards: straight,
      value: calculateHandValue(HandRank.STRAIGHT, straight),
    };
  }
  
  // Check for three of a kind
  if (threeOfAKind.length === 3) {
    const kickers = sorted.filter(c => c.rank !== threeOfAKind[0].rank).slice(0, 2);
    const cards = [...threeOfAKind, ...kickers];
    return {
      rank: HandRank.THREE_OF_A_KIND,
      name: 'Three of a Kind',
      cards,
      value: calculateHandValue(HandRank.THREE_OF_A_KIND, cards),
    };
  }
  
  // Check for two pair
  const allPairs = Array.from(rankGroups.entries())
    .filter(([, g]) => g.length >= 2)
    .sort((a, b) => getRankValue(b[0]) - getRankValue(a[0]));
  
  if (allPairs.length >= 2) {
    const cards = [
      ...allPairs[0][1].slice(0, 2),
      ...allPairs[1][1].slice(0, 2),
    ];
    const kicker = sorted.find(c => 
      c.rank !== allPairs[0][0] && c.rank !== allPairs[1][0]
    );
    if (kicker) cards.push(kicker);
    
    return {
      rank: HandRank.TWO_PAIR,
      name: 'Two Pair',
      cards,
      value: calculateHandValue(HandRank.TWO_PAIR, cards),
    };
  }
  
  // Check for one pair
  if (allPairs.length === 1) {
    const pair = allPairs[0][1].slice(0, 2);
    const kickers = sorted.filter(c => c.rank !== allPairs[0][0]).slice(0, 3);
    const cards = [...pair, ...kickers];
    return {
      rank: HandRank.ONE_PAIR,
      name: 'One Pair',
      cards,
      value: calculateHandValue(HandRank.ONE_PAIR, cards),
    };
  }
  
  // High card
  const cards = sorted.slice(0, 5);
  return {
    rank: HandRank.HIGH_CARD,
    name: 'High Card',
    cards,
    value: calculateHandValue(HandRank.HIGH_CARD, cards),
  };
}

// Compare two hands, returns positive if hand1 wins, negative if hand2 wins, 0 for tie
export function compareHands(hand1: HandResult, hand2: HandResult): number {
  return hand1.value - hand2.value;
}

// Find winner(s) from multiple hands
export function findWinners(
  players: { seatNumber: number; holeCards: Card[]; communityCards: Card[] }[]
): { seatNumber: number; hand: HandResult }[] {
  if (players.length === 0) return [];
  
  const evaluatedHands = players.map(p => ({
    seatNumber: p.seatNumber,
    hand: evaluateHand(p.holeCards, p.communityCards),
  }));
  
  // Sort by hand value descending
  evaluatedHands.sort((a, b) => compareHands(b.hand, a.hand));
  
  // Find all players with the highest hand value (for split pots)
  const highestValue = evaluatedHands[0].hand.value;
  return evaluatedHands.filter(h => h.hand.value === highestValue);
}
