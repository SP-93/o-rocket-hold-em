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

// Helper to extract user from JWT token
async function getUserFromRequest(req: Request, supabase: any): Promise<{ user: any; error: string | null }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { user: null, error: 'Invalid or expired token' };
  }

  return { user, error: null };
}

function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function successResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    // Use anon key for auth verification, service role for DB operations
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, tableId, seatNumber, amount } = await req.json();

    // Actions that require authentication
    const authRequiredActions = ['process_action', 'start_game', 'deal_community', 'showdown'];
    
    let currentUser = null;
    if (authRequiredActions.includes(action)) {
      const { user, error } = await getUserFromRequest(req, supabaseAuth);
      if (error) {
        console.log(`[poker-game] Auth failed: ${error}`);
        return errorResponse(error, 401);
      }
      currentUser = user;
      console.log(`[poker-game] Authenticated user: ${currentUser.id}`);
    }

    switch (action) {
      case "start_game": {
        // SECURITY: Verify user is seated at this table
        const { data: userSeat } = await supabase
          .from("table_seats")
          .select("*")
          .eq("table_id", tableId)
          .eq("user_id", currentUser.id)
          .not("player_wallet", "is", null)
          .maybeSingle();

        if (!userSeat) {
          console.log(`[poker-game] SECURITY: User ${currentUser.id} tried to start game without being seated`);
          return errorResponse("You must be seated at this table to start the game", 403);
        }

        // Get table and seats
        const { data: table } = await supabase
          .from("poker_tables")
          .select("*")
          .eq("id", tableId)
          .single();

        if (!table) {
          return errorResponse("Table not found", 404);
        }

        const { data: seats } = await supabase
          .from("table_seats")
          .select("*")
          .eq("table_id", tableId)
          .not("player_wallet", "is", null)
          .order("seat_number");

        if (!seats || seats.length < 2) {
          return errorResponse("Need at least 2 players to start", 400);
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

        console.log(`[poker-game] Game started at table ${tableId}`);
        return successResponse({ success: true, message: "Game started" });
      }

      case "deal_community": {
        const { data: table } = await supabase
          .from("poker_tables")
          .select("*")
          .eq("id", tableId)
          .single();

        if (!table) {
          return errorResponse("Table not found", 404);
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

        switch (table.current_phase) {
          case "preflop":
            newCards = [...existingCommunity, ...remainingDeck.slice(1, 4)];
            newPhase = "flop";
            break;
          case "flop":
            newCards = [...existingCommunity, remainingDeck[1]];
            newPhase = "turn";
            break;
          case "turn":
            newCards = [...existingCommunity, remainingDeck[1]];
            newPhase = "river";
            break;
          default:
            return errorResponse("Invalid phase for dealing", 400);
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

        console.log(`[poker-game] Dealt ${newPhase} at table ${tableId}`);
        return successResponse({ success: true, phase: newPhase, communityCards: newCards });
      }

      case "process_action": {
        // CRITICAL SECURITY: Verify the user owns this seat
        const { data: table } = await supabase
          .from("poker_tables")
          .select("*")
          .eq("id", tableId)
          .single();

        // SECURITY: Verify seat belongs to authenticated user
        const { data: seat } = await supabase
          .from("table_seats")
          .select("*")
          .eq("table_id", tableId)
          .eq("seat_number", seatNumber)
          .eq("user_id", currentUser.id) // CRITICAL: Must match authenticated user
          .single();

        if (!table || !seat) {
          console.log(`[poker-game] SECURITY: User ${currentUser.id} attempted action on seat ${seatNumber} they don't own`);
          return errorResponse("Invalid table or seat - you don't own this seat", 403);
        }

        // Verify it's actually this player's turn
        if (!seat.is_turn) {
          return errorResponse("Not your turn", 400);
        }

        const body = await req.clone().json();
        const playerAction = body.playerAction as 'fold' | 'check' | 'call' | 'raise' | 'all-in';
        let newChipStack = seat.chip_stack;
        let newCurrentBet = seat.current_bet;
        let newPot = table.pot;
        let newTableBet = table.current_bet;
        let isFolded = seat.is_folded;

        // Validate action
        switch (playerAction) {
          case "fold":
            isFolded = true;
            break;
          case "check":
            // Valid only if current bet matches table bet
            if (seat.current_bet < table.current_bet) {
              return errorResponse("Cannot check - must call or raise", 400);
            }
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
            if (raiseTotal < table.current_bet + table.big_blind) {
              return errorResponse("Raise must be at least big blind more than current bet", 400);
            }
            const toAdd = raiseTotal - seat.current_bet;
            if (toAdd > seat.chip_stack) {
              return errorResponse("Not enough chips for this raise", 400);
            }
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
          default:
            return errorResponse("Invalid action", 400);
        }

        // Log action for audit
        await supabase
          .from("game_actions")
          .insert({
            table_id: tableId,
            player_wallet: seat.player_wallet,
            user_id: currentUser.id,
            action: playerAction,
            amount: playerAction === 'raise' ? amount : null,
            phase: table.current_phase,
          });

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
          return successResponse({ success: true, winner: winner.player_wallet, pot: newPot });
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
            return successResponse({ success: true, phase: nextPhase });
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

        console.log(`[poker-game] Action ${playerAction} by user ${currentUser.id}, next seat: ${nextSeat}`);
        return successResponse({ success: true, nextSeat });
      }

      case "showdown": {
        const { data: table } = await supabase
          .from("poker_tables")
          .select("*")
          .eq("id", tableId)
          .single();

        if (!table) {
          return errorResponse("Table not found", 404);
        }

        const { data: activeSeats } = await supabase
          .from("table_seats")
          .select("*")
          .eq("table_id", tableId)
          .eq("is_folded", false);

        if (!activeSeats || activeSeats.length < 2) {
          return errorResponse("Not enough players for showdown", 400);
        }

        return await handleShowdown(supabase, tableId, table.pot, activeSeats);
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (error: unknown) {
    console.error("[poker-game] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
});

// Hand evaluation and showdown logic
async function handleShowdown(supabase: any, tableId: string, pot: number, activeSeats: any[]) {
  const { data: table } = await supabase
    .from("poker_tables")
    .select("community_cards")
    .eq("id", tableId)
    .single();

  const communityCards = (table?.community_cards as Card[]) || [];

  // Evaluate each player's hand
  const playerHands = activeSeats.map(seat => {
    const holeCards = (seat.cards as Card[]) || [];
    const allCards = [...holeCards, ...communityCards];
    const handRank = evaluateHand(allCards);
    return {
      seat,
      handRank,
    };
  });

  // Sort by hand strength (higher is better)
  playerHands.sort((a, b) => b.handRank.value - a.handRank.value);

  // Find winners (could be tie)
  const bestValue = playerHands[0].handRank.value;
  const winners = playerHands.filter(p => p.handRank.value === bestValue);

  // Split pot among winners
  const potPerWinner = Math.floor(pot / winners.length);
  
  for (const winner of winners) {
    await supabase
      .from("table_seats")
      .update({ chip_stack: winner.seat.chip_stack + potPerWinner })
      .eq("id", winner.seat.id);
  }

  // Reset table
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

  const winnerNames = winners.map(w => w.seat.player_name || w.seat.player_wallet);
  console.log(`[poker-game] Showdown: ${winnerNames.join(', ')} win ${potPerWinner} each`);

  return new Response(
    JSON.stringify({
      success: true,
      winners: winners.map(w => ({
        wallet: w.seat.player_wallet,
        name: w.seat.player_name,
        hand: w.handRank.name,
        winnings: potPerWinner,
      })),
      pot,
    }),
    { headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } }
  );
}

// Simple hand evaluator
function evaluateHand(cards: Card[]): { name: string; value: number } {
  const rankValues: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  };

  const ranks = cards.map(c => rankValues[c.rank]).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);

  // Count ranks and suits
  const rankCounts: Record<number, number> = {};
  const suitCounts: Record<string, number> = {};

  for (const rank of ranks) {
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
  }
  for (const suit of suits) {
    suitCounts[suit] = (suitCounts[suit] || 0) + 1;
  }

  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const isFlush = Object.values(suitCounts).some(c => c >= 5);
  
  // Check for straight
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);
  let isStraight = false;
  let straightHigh = 0;

  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    if (uniqueRanks[i] - uniqueRanks[i + 4] === 4) {
      isStraight = true;
      straightHigh = uniqueRanks[i];
      break;
    }
  }
  
  // Ace-low straight (A-2-3-4-5)
  if (!isStraight && uniqueRanks.includes(14) && uniqueRanks.includes(5) && 
      uniqueRanks.includes(4) && uniqueRanks.includes(3) && uniqueRanks.includes(2)) {
    isStraight = true;
    straightHigh = 5;
  }

  // Determine hand rank
  if (isFlush && isStraight && straightHigh === 14) {
    return { name: 'Royal Flush', value: 10000 };
  }
  if (isFlush && isStraight) {
    return { name: 'Straight Flush', value: 9000 + straightHigh };
  }
  if (counts[0] === 4) {
    return { name: 'Four of a Kind', value: 8000 + ranks[0] };
  }
  if (counts[0] === 3 && counts[1] === 2) {
    return { name: 'Full House', value: 7000 + ranks[0] };
  }
  if (isFlush) {
    return { name: 'Flush', value: 6000 + ranks[0] };
  }
  if (isStraight) {
    return { name: 'Straight', value: 5000 + straightHigh };
  }
  if (counts[0] === 3) {
    return { name: 'Three of a Kind', value: 4000 + ranks[0] };
  }
  if (counts[0] === 2 && counts[1] === 2) {
    return { name: 'Two Pair', value: 3000 + Math.max(...ranks.filter((r, i) => rankCounts[r] === 2)) };
  }
  if (counts[0] === 2) {
    return { name: 'One Pair', value: 2000 + ranks.find(r => rankCounts[r] === 2)! };
  }
  return { name: 'High Card', value: 1000 + ranks[0] };
}
