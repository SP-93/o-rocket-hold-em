import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Card types
interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
}

const SUITS: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Card['rank'][] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Create and shuffle deck
function createShuffledDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, tableId, seatNumber, walletAddress, amount } = await req.json();

    switch (action) {
      case "start_game": {
        // Get table and seats
        const { data: table } = await supabase
          .from("poker_tables")
          .select("*")
          .eq("id", tableId)
          .single();

        if (!table) {
          return new Response(
            JSON.stringify({ error: "Table not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: seats } = await supabase
          .from("table_seats")
          .select("*")
          .eq("table_id", tableId)
          .not("player_wallet", "is", null)
          .order("seat_number");

        if (!seats || seats.length < 2) {
          return new Response(
            JSON.stringify({ error: "Need at least 2 players to start" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create and shuffle deck
        const deck = createShuffledDeck();
        
        // Deal hole cards
        const holeCards: Card[][] = [];
        let cardIndex = 0;
        
        // First card to each player
        for (let i = 0; i < seats.length; i++) {
          holeCards[i] = [deck[cardIndex++]];
        }
        // Second card to each player
        for (let i = 0; i < seats.length; i++) {
          holeCards[i].push(deck[cardIndex++]);
        }

        // Determine positions
        const newDealerPos = (table.dealer_position + 1) % seats.length;
        const sbPos = (newDealerPos + 1) % seats.length;
        const bbPos = (newDealerPos + 2) % seats.length;
        const utgPos = seats.length > 2 ? (newDealerPos + 3) % seats.length : sbPos;

        // Update seats with cards and blinds
        for (let i = 0; i < seats.length; i++) {
          const seat = seats[i];
          const isDealer = i === newDealerPos;
          const isSB = i === sbPos;
          const isBB = i === bbPos;
          const isUTG = i === utgPos;

          let chipStack = seat.chip_stack;
          let currentBet = 0;

          if (isSB) {
            const sbAmount = Math.min(table.small_blind, chipStack);
            chipStack -= sbAmount;
            currentBet = sbAmount;
          } else if (isBB) {
            const bbAmount = Math.min(table.big_blind, chipStack);
            chipStack -= bbAmount;
            currentBet = bbAmount;
          }

          await supabase
            .from("table_seats")
            .update({
              cards: holeCards[i],
              is_dealer: isDealer,
              is_small_blind: isSB,
              is_big_blind: isBB,
              is_turn: isUTG,
              is_folded: false,
              chip_stack: chipStack,
              current_bet: currentBet,
              last_action: null,
            })
            .eq("id", seat.id);
        }

        // Update table state
        const pot = table.small_blind + table.big_blind;
        await supabase
          .from("poker_tables")
          .update({
            status: "playing",
            current_phase: "preflop",
            dealer_position: seats[newDealerPos].seat_number,
            active_player_seat: seats[utgPos].seat_number,
            pot: pot,
            current_bet: table.big_blind,
            community_cards: [],
          })
          .eq("id", tableId);

        return new Response(
          JSON.stringify({ success: true, message: "Game started" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "deal_community": {
        const { data: table } = await supabase
          .from("poker_tables")
          .select("*")
          .eq("id", tableId)
          .single();

        if (!table) {
          return new Response(
            JSON.stringify({ error: "Table not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get all dealt cards to exclude
        const { data: seats } = await supabase
          .from("table_seats")
          .select("cards")
          .eq("table_id", tableId)
          .not("cards", "is", null);

        const usedCards = new Set<string>();
        const existingCommunity = (table.community_cards as Card[]) || [];
        
        existingCommunity.forEach((c: Card) => usedCards.add(`${c.rank}-${c.suit}`));
        seats?.forEach(s => {
          (s.cards as Card[] || []).forEach((c: Card) => usedCards.add(`${c.rank}-${c.suit}`));
        });

        // Create remaining deck
        const remainingDeck: Card[] = [];
        for (const suit of SUITS) {
          for (const rank of RANKS) {
            if (!usedCards.has(`${rank}-${suit}`)) {
              remainingDeck.push({ suit, rank });
            }
          }
        }

        // Shuffle remaining
        for (let i = remainingDeck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [remainingDeck[i], remainingDeck[j]] = [remainingDeck[j], remainingDeck[i]];
        }

        let newPhase: string;
        let newCards: Card[];
        let burnAndDeal: number;

        switch (table.current_phase) {
          case "preflop":
            burnAndDeal = 4; // burn 1, deal 3
            newCards = [...existingCommunity, ...remainingDeck.slice(1, 4)];
            newPhase = "flop";
            break;
          case "flop":
            burnAndDeal = 2; // burn 1, deal 1
            newCards = [...existingCommunity, remainingDeck[1]];
            newPhase = "turn";
            break;
          case "turn":
            burnAndDeal = 2;
            newCards = [...existingCommunity, remainingDeck[1]];
            newPhase = "river";
            break;
          default:
            return new Response(
              JSON.stringify({ error: "Invalid phase for dealing" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Reset bets for new round
        await supabase
          .from("table_seats")
          .update({ current_bet: 0, last_action: null })
          .eq("table_id", tableId)
          .eq("is_folded", false);

        // Find first active player after dealer
        const { data: activeSeats } = await supabase
          .from("table_seats")
          .select("seat_number")
          .eq("table_id", tableId)
          .eq("is_folded", false)
          .order("seat_number");

        let nextActiveSeat = activeSeats?.[0]?.seat_number || null;

        await supabase
          .from("poker_tables")
          .update({
            current_phase: newPhase,
            community_cards: newCards,
            current_bet: 0,
            active_player_seat: nextActiveSeat,
          })
          .eq("id", tableId);

        // Update is_turn
        if (nextActiveSeat) {
          await supabase
            .from("table_seats")
            .update({ is_turn: false })
            .eq("table_id", tableId);
            
          await supabase
            .from("table_seats")
            .update({ is_turn: true })
            .eq("table_id", tableId)
            .eq("seat_number", nextActiveSeat);
        }

        return new Response(
          JSON.stringify({ success: true, phase: newPhase, communityCards: newCards }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "process_action": {
        // Handle fold, check, call, raise, all-in
        const { data: table } = await supabase
          .from("poker_tables")
          .select("*")
          .eq("id", tableId)
          .single();

        const { data: seat } = await supabase
          .from("table_seats")
          .select("*")
          .eq("table_id", tableId)
          .eq("seat_number", seatNumber)
          .single();

        if (!table || !seat) {
          return new Response(
            JSON.stringify({ error: "Invalid table or seat" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const body = await req.clone().json();
        const playerAction = body.playerAction as 'fold' | 'check' | 'call' | 'raise' | 'all-in';
        let newChipStack = seat.chip_stack;
        let newCurrentBet = seat.current_bet;
        let newPot = table.pot;
        let newTableBet = table.current_bet;
        let isFolded = seat.is_folded;

        switch (playerAction) {
          case "fold":
            isFolded = true;
            break;
          case "check":
            // Valid only if current bet matches table bet
            break;
          case "call": {
            const toCall = table.current_bet - seat.current_bet;
            const actualCall = Math.min(toCall, seat.chip_stack);
            newChipStack -= actualCall;
            newCurrentBet += actualCall;
            newPot += actualCall;
            break;
          }
          case "raise": {
            const raiseTotal = amount || (table.current_bet + table.big_blind);
            const toAdd = raiseTotal - seat.current_bet;
            newChipStack -= toAdd;
            newCurrentBet = raiseTotal;
            newPot += toAdd;
            newTableBet = raiseTotal;
            break;
          }
          case "all-in": {
            const allIn = seat.chip_stack;
            newPot += allIn;
            newCurrentBet += allIn;
            newChipStack = 0;
            if (newCurrentBet > table.current_bet) {
              newTableBet = newCurrentBet;
            }
            break;
          }
        }

        // Update seat
        await supabase
          .from("table_seats")
          .update({
            chip_stack: newChipStack,
            current_bet: newCurrentBet,
            is_folded: isFolded,
            is_turn: false,
            last_action: playerAction,
          })
          .eq("id", seat.id);

        // Find next active player
        const { data: allSeats } = await supabase
          .from("table_seats")
          .select("*")
          .eq("table_id", tableId)
          .eq("is_folded", false)
          .order("seat_number");

        // Check if only one player remains
        const activePlayers = allSeats?.filter(s => !s.is_folded) || [];
        if (activePlayers.length === 1) {
          // Award pot to winner
          const winner = activePlayers[0];
          await supabase
            .from("table_seats")
            .update({ chip_stack: winner.chip_stack + newPot })
            .eq("id", winner.id);

          await supabase
            .from("poker_tables")
            .update({
              status: "waiting",
              current_phase: "waiting",
              pot: 0,
              current_bet: 0,
              community_cards: [],
            })
            .eq("id", tableId);

          // Reset all seats
          await supabase
            .from("table_seats")
            .update({
              cards: [],
              is_turn: false,
              is_folded: false,
              current_bet: 0,
              last_action: null,
              is_dealer: false,
              is_small_blind: false,
              is_big_blind: false,
            })
            .eq("table_id", tableId);

          console.log(`[poker-game] Player ${winner.player_wallet} wins pot of ${newPot}`);
          return new Response(
            JSON.stringify({ success: true, winner: winner.player_wallet, pot: newPot }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if betting round is complete
        const playersWithChips = activePlayers.filter(s => s.chip_stack > 0);
        const allBetsEqual = playersWithChips.every(s => s.current_bet === newTableBet || s.chip_stack === 0);
        const allActed = playersWithChips.every(s => s.last_action !== null);

        if (allBetsEqual && allActed) {
          // Advance to next phase or showdown
          if (table.current_phase === "river") {
            // Showdown - determine winner
            return await handleShowdown(supabase, tableId, newPot, activePlayers);
          } else {
            // Deal next community cards
            const phaseMap: Record<string, string> = {
              preflop: "flop",
              flop: "turn",
              turn: "river",
            };
            const nextPhase = phaseMap[table.current_phase];
            
            // Get remaining deck cards
            const usedCards = new Set<string>();
            const existingCommunity = (table.community_cards as Card[]) || [];
            existingCommunity.forEach((c: Card) => usedCards.add(`${c.rank}-${c.suit}`));
            allSeats?.forEach(s => {
              (s.cards as Card[] || []).forEach((c: Card) => usedCards.add(`${c.rank}-${c.suit}`));
            });

            const remainingDeck: Card[] = [];
            for (const suit of SUITS) {
              for (const rank of RANKS) {
                if (!usedCards.has(`${rank}-${suit}`)) {
                  remainingDeck.push({ suit, rank });
                }
              }
            }

            // Shuffle
            for (let i = remainingDeck.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [remainingDeck[i], remainingDeck[j]] = [remainingDeck[j], remainingDeck[i]];
            }

            let newCards: Card[];
            if (table.current_phase === "preflop") {
              newCards = [...existingCommunity, ...remainingDeck.slice(1, 4)]; // burn 1, deal 3
            } else {
              newCards = [...existingCommunity, remainingDeck[1]]; // burn 1, deal 1
            }

            // Reset bets and set first player
            await supabase
              .from("table_seats")
              .update({ current_bet: 0, last_action: null, is_turn: false })
              .eq("table_id", tableId);

            const firstPlayer = activePlayers[0];
            await supabase
              .from("table_seats")
              .update({ is_turn: true })
              .eq("id", firstPlayer.id);

            await supabase
              .from("poker_tables")
              .update({
                current_phase: nextPhase,
                community_cards: newCards,
                current_bet: 0,
                active_player_seat: firstPlayer.seat_number,
              })
              .eq("id", tableId);

            console.log(`[poker-game] Advanced to ${nextPhase}`);
            return new Response(
              JSON.stringify({ success: true, phase: nextPhase }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Continue to next player
        const seatNumbers = playersWithChips.map(s => s.seat_number);
        const currentIdx = seatNumbers.indexOf(seatNumber);
        const nextIdx = (currentIdx + 1) % seatNumbers.length;
        const nextSeat = seatNumbers[nextIdx];

        await supabase
          .from("table_seats")
          .update({ is_turn: true })
          .eq("table_id", tableId)
          .eq("seat_number", nextSeat);

        await supabase
          .from("poker_tables")
          .update({
            pot: newPot,
            current_bet: newTableBet,
            active_player_seat: nextSeat,
          })
          .eq("id", tableId);

        // Log action
        await supabase.from("game_actions").insert({
          table_id: tableId,
          player_wallet: walletAddress,
          action: playerAction,
          amount: amount,
          phase: table.current_phase,
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "showdown": {
        const { data: table } = await supabase
          .from("poker_tables")
          .select("*")
          .eq("id", tableId)
          .single();

        const { data: activeSeats } = await supabase
          .from("table_seats")
          .select("*")
          .eq("table_id", tableId)
          .eq("is_folded", false)
          .order("seat_number");

        if (!table || !activeSeats) {
          return new Response(
            JSON.stringify({ error: "Table not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return await handleShowdown(supabase, tableId, table.pot, activeSeats);
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Hand evaluation helpers
const RANK_VALUES: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

function evaluateHand(holeCards: Card[], communityCards: Card[]): { rank: number; value: number } {
  const allCards = [...holeCards, ...communityCards];
  
  // Group by suit and rank
  const bySuit: Record<string, Card[]> = {};
  const byRank: Record<string, Card[]> = {};
  
  for (const card of allCards) {
    if (!bySuit[card.suit]) bySuit[card.suit] = [];
    if (!byRank[card.rank]) byRank[card.rank] = [];
    bySuit[card.suit].push(card);
    byRank[card.rank].push(card);
  }

  // Check for flush
  let flush: Card[] | null = null;
  for (const suit in bySuit) {
    if (bySuit[suit].length >= 5) {
      flush = bySuit[suit].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]).slice(0, 5);
    }
  }

  // Check for straight
  const rankSet = new Set(allCards.map(c => RANK_VALUES[c.rank]));
  let straight: number[] = [];
  const sortedRanks = Array.from(rankSet).sort((a, b) => b - a);
  
  // Add low ace for wheel straight
  if (rankSet.has(14)) sortedRanks.push(1);
  
  for (let i = 0; i <= sortedRanks.length - 5; i++) {
    let consecutive = true;
    for (let j = 0; j < 4; j++) {
      if (sortedRanks[i + j] - sortedRanks[i + j + 1] !== 1) {
        consecutive = false;
        break;
      }
    }
    if (consecutive) {
      straight = sortedRanks.slice(i, i + 5);
      break;
    }
  }

  // Count groups
  const groups = Object.values(byRank).map(cards => cards.length).sort((a, b) => b - a);
  const groupedRanks = Object.entries(byRank)
    .sort((a, b) => {
      if (b[1].length !== a[1].length) return b[1].length - a[1].length;
      return RANK_VALUES[b[0]] - RANK_VALUES[a[0]];
    });

  // Determine hand rank
  if (flush && straight.length === 5) {
    // Check if flush cards form straight
    const flushRanks = flush.map(c => RANK_VALUES[c.rank]);
    if (flushRanks[0] === 14 && flushRanks[1] === 13) {
      return { rank: 9, value: 14 }; // Royal flush
    }
    return { rank: 8, value: flushRanks[0] }; // Straight flush
  }
  if (groups[0] === 4) {
    return { rank: 7, value: RANK_VALUES[groupedRanks[0][0]] }; // Four of a kind
  }
  if (groups[0] === 3 && groups[1] >= 2) {
    return { rank: 6, value: RANK_VALUES[groupedRanks[0][0]] * 100 + RANK_VALUES[groupedRanks[1][0]] }; // Full house
  }
  if (flush) {
    return { rank: 5, value: RANK_VALUES[flush[0].rank] }; // Flush
  }
  if (straight.length === 5) {
    return { rank: 4, value: straight[0] }; // Straight
  }
  if (groups[0] === 3) {
    return { rank: 3, value: RANK_VALUES[groupedRanks[0][0]] }; // Three of a kind
  }
  if (groups[0] === 2 && groups[1] === 2) {
    return { rank: 2, value: Math.max(RANK_VALUES[groupedRanks[0][0]], RANK_VALUES[groupedRanks[1][0]]) * 100 + Math.min(RANK_VALUES[groupedRanks[0][0]], RANK_VALUES[groupedRanks[1][0]]) }; // Two pair
  }
  if (groups[0] === 2) {
    return { rank: 1, value: RANK_VALUES[groupedRanks[0][0]] }; // Pair
  }
  
  // High card
  const highCards = sortedRanks.slice(0, 5);
  return { rank: 0, value: highCards[0] };
}

async function handleShowdown(supabase: any, tableId: string, pot: number, activeSeats: any[]) {
  const { data: table } = await supabase
    .from("poker_tables")
    .select("community_cards")
    .eq("id", tableId)
    .single();

  const communityCards = (table?.community_cards || []) as Card[];
  
  // Evaluate each player's hand
  const playerHands = activeSeats.map(seat => {
    const holeCards = (seat.cards || []) as Card[];
    const hand = evaluateHand(holeCards, communityCards);
    return { seat, hand };
  });

  // Find best hand
  playerHands.sort((a, b) => {
    if (b.hand.rank !== a.hand.rank) return b.hand.rank - a.hand.rank;
    return b.hand.value - a.hand.value;
  });

  const bestHand = playerHands[0].hand;
  const winners = playerHands.filter(p => p.hand.rank === bestHand.rank && p.hand.value === bestHand.value);
  const potShare = Math.floor(pot / winners.length);

  // Award pot to winner(s)
  for (const winner of winners) {
    await supabase
      .from("table_seats")
      .update({ chip_stack: winner.seat.chip_stack + potShare })
      .eq("id", winner.seat.id);
  }

  console.log(`[poker-game] Showdown winners: ${winners.map(w => w.seat.player_wallet).join(', ')}, pot: ${pot}`);

  // Reset table for next hand
  await supabase
    .from("poker_tables")
    .update({
      status: "waiting",
      current_phase: "waiting",
      pot: 0,
      current_bet: 0,
      community_cards: [],
    })
    .eq("id", tableId);

  // Reset all seats
  await supabase
    .from("table_seats")
    .update({
      cards: [],
      is_turn: false,
      is_folded: false,
      current_bet: 0,
      last_action: null,
      is_dealer: false,
      is_small_blind: false,
      is_big_blind: false,
    })
    .eq("table_id", tableId);

  return new Response(
    JSON.stringify({ 
      success: true, 
      showdown: true,
      winners: winners.map(w => w.seat.player_wallet),
      potShare,
      handRank: bestHand.rank,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
