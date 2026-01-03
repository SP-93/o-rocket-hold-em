# O'Rocket Hold'em - Smart Contracts

## Pregled Arhitekture

**Hibridni Model:**
- 🔗 **On-chain:** WOVER deposit/withdrawal (smart contract)
- 💻 **Off-chain:** Gameplay logika (Supabase backend)

## Contracts

### PokerChipManager

Glavni contract za upravljanje čipovima.

| Network | Address | Status |
|---------|---------|--------|
| Over Mainnet | `[TBD - deploy sa admin wallet-a]` | ⏳ Pending |
| Over Testnet | `[TBD]` | ⏳ Pending |

**Admin Wallet (Deployer/Owner):** `0x8334966329b7f4b459633696A8CA59118253bC89`

**Fajlovi:**
- `PokerChipManager.sol` - Glavni contract
- `IPokerChipManager.sol` - Interface za frontend
- `PokerChipManagerABI.json` - ABI za integraciju

**Funkcionalnosti:**
- `buyIn(uint256 woverAmount)` - Deposit WOVER, dobij čipove
- `cashOut(uint256 chipAmount)` - Zameni čipove za WOVER
- `lockChipsToTable()` - Admin zaključava čipove za sto (backend)
- `unlockChipsFromTable()` - Admin otključava čipove (backend)
- `settleGame()` - Admin distribuira čipove nakon igre (backend)
- `emergencyUnlock()` - Admin hitno otključavanje

**Konstante:**
- `CHIPS_PER_WOVER = 100` (1 WOVER = 100 čipova)
- `MIN_DEPOSIT = 1 WOVER`
- `MIN_WITHDRAWAL = 100 čipova`

---

## Sigurnosne Mere

### Smart Contract
- ✅ `ReentrancyGuard` - Zaštita od reentrancy napada
- ✅ `Ownable` - Samo admin može settle-ovati igre
- ✅ `Checks-Effects-Interactions` pattern
- ✅ Custom errors za gas efikasnost
- ✅ Chip conservation validation u `settleGame`

### Backend
- ✅ Service role za balance update (korisnici ne mogu direktno)
- ✅ RLS policies - read only za korisnike
- ✅ Event tracking za audit trail
- ✅ Tx hash validacija pre ažuriranja balance-a

---

## Deployment Uputstvo

### Preduslovi
1. Admin wallet sa dovoljno OVER za gas
2. WOVER token adresa na target mreži
3. Hardhat/Foundry setup

### Koraci

```bash
# 1. Kompajliraj contract
npx hardhat compile

# 2. Deploy na testnet
npx hardhat run scripts/deploy.ts --network over-testnet

# 3. Verifikuj na explorer-u
npx hardhat verify --network over-testnet <CONTRACT_ADDRESS> <WOVER_TOKEN_ADDRESS>

# 4. Transfer ownership na admin wallet
# (ako se deploy-uje sa drugog wallet-a)
```

### Post-Deploy Konfiguracija

1. **Dodaj secrets u Supabase:**
   - `POKER_CONTRACT_ADDRESS` - Adresa deploy-ovanog contract-a
   - `WOVER_TOKEN_ADDRESS` - Adresa WOVER ERC-20 tokena
   - `ADMIN_WALLET_PRIVATE_KEY` - Privatni ključ admin wallet-a

2. **Verifikuj ownership:**
   ```solidity
   // Proveri da je admin wallet owner
   PokerChipManager.owner() == ADMIN_WALLET
   ```

3. **Test flow:**
   - Deposit WOVER → Proveri chip balance
   - Join table → Proveri lock
   - Play → Settle → Proveri distribution
   - Cashout → Proveri WOVER balance

---

## Admin Wallet

| Info | Vrednost |
|------|----------|
| Adresa | `0x8334966329b7f4b459633696A8CA59118253bC89` |
| Uloga | Contract Owner + Settlement Signer |
| Mreža | Over Protocol Mainnet (Chain ID: 54176) |
| Pristup | Backend edge functions (service role) |

**Odgovornosti:**
- Deploy i ownership svih contract-a
- Potpisivanje `lockChipsToTable` i `settleGame` transakcija
- Emergency unlock u slučaju stuck igara

**VAŽNO:** Privatni ključ NIKADA nije u frontend kodu. Samo u Supabase secrets.

### Secrets za konfiguraciju (Supabase Dashboard > Edge Functions > Secrets):

| Secret | Opis | Status |
|--------|------|--------|
| `ADMIN_WALLET_PRIVATE_KEY` | Privatni ključ admin wallet-a | ⏳ Pending |
| `POKER_CONTRACT_ADDRESS` | Adresa deploy-ovanog contract-a | ⏳ Pending |
| `WOVER_TOKEN_ADDRESS` | Adresa WOVER ERC-20 tokena | ⏳ Pending |

---

## Token Integracija

### WOVER Token
- **Standard:** ERC-20
- **Adresa (Mainnet):** `[TBD]`
- **Adresa (Testnet):** `[TBD]`

### Conversion Rate
```
1 WOVER = 100 Poker Chips
100 Chips = 1 WOVER (za cashout)
```

---

## Edge Functions

### chip-manager
Upravlja chip balance-ima u bazi.

**Akcije:**
- `get_balance` - Dohvati balance igrača
- `verify_deposit` - Verifikuj on-chain deposit
- `join_table` - Zaključaj čipove za sto
- `leave_table` - Otključaj čipove
- `process_settlement` - Procesiraj kraj igre

### poker-game
Upravlja gameplay logikom.

**Integracija sa chip-manager:**
- Pre join-a: Poziva `join_table` za lock
- Na showdown: Poziva `process_settlement`
- Na leave: Poziva `leave_table` za unlock

---

## Database Tabele

### player_balances
Prati chip balance za svakog igrača.

| Kolona | Opis |
|--------|------|
| wallet_address | Wallet adresa igrača |
| on_chain_chips | Čipovi backed on-chain |
| available_chips | Slobodni čipovi za igru |
| locked_in_games | Čipovi zaključani u aktivnim igrama |

### deposit_events
Audit log za on-chain evente.

### game_settlements
Audit log za završene igre.

---

## Flow Dijagrami

### Buy-In Flow
```
User                    Frontend               Contract              Backend
  |                        |                      |                     |
  |-- Connect Wallet ----->|                      |                     |
  |-- Approve WOVER ------>|                      |                     |
  |                        |-- buyIn(amount) ---->|                     |
  |                        |                      |-- Deposit Event --->|
  |                        |                      |                     |-- verify_deposit
  |                        |                      |                     |-- Update balance
  |<-- Chips Credited -----|<-- Balance Update ---|<--------------------|
```

### Game Settlement Flow
```
Backend (poker-game)           chip-manager              Contract
        |                           |                       |
        |-- process_settlement ---->|                       |
        |                           |-- Update balances --->|
        |                           |                       |
        |                           |-- (Future: settleGame) 
        |                           |                       |
        |<-- Settlement Complete ---|                       |
```

---

## Verzije

| Verzija | Datum | Promene |
|---------|-------|---------|
| 0.1.0 | 2026-01-03 | Inicijalni contract, chip-manager edge function |
