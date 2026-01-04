# Phase 9: Email + Wallet Hybrid Authentication Architecture

**Date:** 2026-01-04  
**Status:** Implementation Complete

---

## Overview

This document describes the security architecture implemented for O'Rocket Hold'em poker platform. The system uses a hybrid authentication model combining traditional email/password authentication with blockchain wallet linking.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER IDENTITY LAYER                              │
│  ┌──────────────────┐     ┌──────────────────┐                          │
│  │   Email/Password │────▶│   auth.users     │                          │
│  │      Login       │     │   (Primary ID)   │                          │
│  └──────────────────┘     └────────┬─────────┘                          │
│                                    │                                     │
│                           ┌────────▼─────────┐                          │
│                           │  player_profiles  │                          │
│                           │  player_balances  │                          │
│                           └────────┬─────────┘                          │
│                                    │                                     │
│  ┌──────────────────┐     ┌────────▼─────────┐                          │
│  │  Wallet Linking  │────▶│   user_wallets   │                          │
│  │  (Signature)     │     │ (Multiple/User)  │                          │
│  └──────────────────┘     └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         CHIP ECONOMY LAYER                               │
│                                                                          │
│  ┌───────────────┐     ┌─────────────────┐     ┌───────────────┐       │
│  │   On-Chain    │     │    Off-Chain    │     │   On-Chain    │       │
│  │   buyIn()     │────▶│  Poker Gameplay │────▶│   cashOut()   │       │
│  │   (Deposit)   │     │  (Fast, Secure) │     │  (Withdraw)   │       │
│  └───────────────┘     └─────────────────┘     └───────────────┘       │
│         │                       │                       ▲               │
│         │                       │                       │               │
│         ▼                       ▼                       │               │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                     player_balances                          │       │
│  │  available_chips | locked_in_games | on_chain_chips          │       │
│  └─────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Security Model

### 1. User Identity

**Primary Identity:** `auth.users.id` (UUID)
- Created via email/password signup
- All chip balances and game state tied to user ID
- Wallets are secondary, can be added/removed/changed

**Database Tables Updated:**
- `player_profiles.user_id` → References auth.users
- `player_balances.user_id` → References auth.users
- `table_seats.user_id` → References auth.users
- `game_actions.user_id` → References auth.users

### 2. Wallet Linking

**New Table: `user_wallets`**
```sql
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  wallet_address TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN DEFAULT false,
  label TEXT,
  connected_at TIMESTAMPTZ
);
```

**Linking Flow:**
1. User authenticates via email/password
2. User connects wallet via Web3Modal
3. Wallet signs message: "Link wallet to O'Rocket: {email}:{timestamp}"
4. Backend verifies signature and stores wallet

**Primary Wallet:**
- Used for on-chain buyIn/cashOut transactions
- Trigger ensures only one primary per user
- Can be changed by user at any time

### 3. Authentication Flow

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│   Signup   │────▶│   Login    │────▶│   Lobby    │
│  (Email)   │     │  (Email)   │     │ (Protected)│
└────────────┘     └────────────┘     └────────────┘
                          │
                          ▼
                   ┌────────────┐
                   │   Wallet   │
                   │  Linking   │
                   │ (Optional) │
                   └────────────┘
```

**Protected Routes:**
- `/lobby` - Game lobby
- `/table/:id` - Poker table
- `/chipshop` - Buy/sell chips
- `/admin` - Admin panel
- `/settings/wallets` - Wallet management

---

## Chip Economy

### Conversion Rate
```
1 WOVER = 1 CHIP
Max Supply: 1,000,000,000 CHIPS
```

### Balance States

| State | Description |
|-------|-------------|
| `available_chips` | Chips available to join games |
| `locked_in_games` | Chips currently in active games |
| `on_chain_chips` | Net on-chain balance (deposits - withdrawals) |

### Transaction Flow

**Deposit (buyIn):**
```
1. User calls contract.buyIn(woverAmount)
2. WOVER transferred to contract
3. Backend detects Deposit event
4. Backend: available_chips += woverAmount
5. Backend: on_chain_chips += woverAmount
```

**Gameplay (off-chain):**
```
1. User joins table: available → locked
2. During game: chips move between players
3. User leaves table: locked → available (with profit/loss)
```

**Withdrawal (cashOut):**
```
1. User requests payout via backend
2. Backend: available_chips -= amount
3. Admin processes payout on-chain
4. Contract sends WOVER to user's primary wallet
```

---

## Security Guarantees

### Poker Action Validation

**Before (Vulnerable):**
```typescript
// ❌ INSECURE: Only checked walletAddress from request
const { data: seat } = await supabase
  .from("table_seats")
  .eq("table_id", tableId)
  .eq("player_wallet", walletAddress) // Could be spoofed!
```

**After (Secure):**
```typescript
// ✅ SECURE: Verify user owns the seat via JWT
const { user, error } = await getUserFromRequest(req, supabase);
if (error) return errorResponse(error, 401);

const { data: seat } = await supabase
  .from("table_seats")
  .eq("table_id", tableId)
  .eq("seat_number", seatNumber)
  .eq("user_id", user.id) // MUST match authenticated user
  .single();

if (!seat) {
  return errorResponse("Not your seat", 403);
}
```

### Security Matrix

| Threat | Before | After | Method |
|--------|--------|-------|--------|
| Fake poker actions | ❌ Possible | ✅ Blocked | JWT + user_id validation |
| Chip creation from nothing | ✅ Blocked | ✅ Blocked | Only buyIn creates chips |
| Chip theft during game | ⚠️ Risk | ✅ Blocked | user_id ownership check |
| Wallet spoofing | ❌ Possible | ✅ Blocked | Signature verification |
| Session hijacking | ⚠️ localStorage | ✅ Secure | Supabase Auth + HTTPS |
| Lost wallet access | ❌ Game over | ✅ Recoverable | Can change primary wallet |

### RLS Policies

**player_balances:**
```sql
-- Users can only view their own balance
CREATE POLICY "Users can view own balance" ON player_balances
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can modify balances
CREATE POLICY "Service role manages balances" ON player_balances
  FOR ALL USING (auth.role() = 'service_role');
```

**user_wallets:**
```sql
-- Users can manage their own wallets
CREATE POLICY "Users can view own wallets" ON user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets" ON user_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Implementation Files

### New Files Created
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/components/ProtectedRoute.tsx` - Route protection wrapper
- `src/pages/Auth.tsx` - Login/Signup page
- `src/hooks/useUserWallets.ts` - Wallet management hook
- `src/pages/settings/Wallets.tsx` - Wallet settings UI

### Modified Files
- `src/App.tsx` - Added AuthProvider, protected routes
- `supabase/functions/poker-game/index.ts` - JWT validation
- `supabase/functions/chip-manager/index.ts` - user_id based operations

### Database Changes
- Added `user_wallets` table
- Added `user_id` column to: `player_profiles`, `player_balances`, `table_seats`, `game_actions`
- Added `handle_new_user()` trigger for auto-profile creation
- Added `ensure_single_primary_wallet()` trigger

---

## Smart Contract Integration

**Contract:** `PokerChipManager.sol`  
**Network:** Over Protocol  
**WOVER Token:** `0x59c914C8ac6F212bb655737CC80d9Abc79A1e273`

### Contract Functions
```solidity
function buyIn(uint256 woverAmount) external
function cashOut(address player, uint256 chipAmount) external onlyOwner
function getPlayerBalance(address player) external view returns (uint256)
```

### Event Listening
Backend listens for:
- `Deposit(address player, uint256 woverAmount, uint256 chips)`
- `Withdrawal(address player, uint256 woverAmount, uint256 chips)`

---

## Future Improvements

1. **2FA Support** - Optional TOTP for enhanced security
2. **Session Management** - Device tracking, remote logout
3. **Wallet Signature Verification** - Full EIP-712 typed data signing
4. **Rate Limiting** - Per-user action rate limits
5. **Audit Logging** - Comprehensive action logging for security review
