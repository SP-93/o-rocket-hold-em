# Development Log - 2026-01-03 - Phase 6: Smart Contract & Chip Management

## Implementirano

### 1. Smart Contract - PokerChipManager.sol
**Lokacija:** `docs/contracts/PokerChipManager.sol`

Glavni contract za WOVER ↔ chip konverziju:
- `buyIn(uint256 woverAmount)` - Deposit WOVER, dobij čipove (1 WOVER = 100 chips)
- `cashOut(uint256 chipAmount)` - Zameni čipove za WOVER
- `lockChipsToTable()` - Admin zaključava čipove kad igrač seda za sto
- `unlockChipsFromTable()` - Admin otključava čipove
- `settleGame()` - Admin distribuira čipove posle igre
- `emergencyUnlock()` - Hitno otključavanje za stuck igre

**Sigurnosne mere:**
- ReentrancyGuard na svim funkcijama
- onlyOwner za admin operacije
- Chip conservation validation
- Custom errors za gas efikasnost
- Checks-Effects-Interactions pattern

### 2. Contract Interface & ABI
**Fajlovi:**
- `docs/contracts/IPokerChipManager.sol` - Interface za frontend
- `docs/contracts/PokerChipManagerABI.json` - ABI za web3 integraciju

### 3. Database Migracija

**Nove tabele:**
- `player_balances` - Prati chip balance po wallet-u
  - `on_chain_chips` - Čipovi backed on-chain
  - `available_chips` - Slobodni za igru
  - `locked_in_games` - Zaključani u aktivnim igrama
  
- `deposit_events` - Audit log za blockchain evente
  - Prati svaki deposit/withdrawal sa tx_hash
  
- `game_settlements` - Audit log za završene igre
  - Čuva settlement_data kao JSONB

**Ažurirana tabela:**
- `table_seats` - Dodata kolona `on_chain_buy_in`

**RLS Policies:**
- Svi mogu čitati balance (potrebno za prikaz)
- Samo service role može insert/update (backend only)

### 4. Edge Function - chip-manager
**Lokacija:** `supabase/functions/chip-manager/index.ts`

**Akcije:**
- `get_balance` - Dohvati ili kreiraj balance za wallet
- `verify_deposit` - Verifikuj on-chain deposit, update balance
- `join_table` - Zaključaj čipove kad igrač seda
- `leave_table` - Otključaj čipove kad igrač ustaje
- `process_settlement` - Procesiraj kraj igre, distribuiraj čipove
- `sync_balance` - Sinhronizuj sa on-chain stanjem

---

## Arhitektura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  - Wagmi/Web3Modal za wallet konekciju                          │
│  - Contract calls za buyIn/cashOut                              │
│  - Supabase realtime za balance updates                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
┌───────────────────┐                   ┌───────────────────────┐
│  SMART CONTRACT   │                   │   SUPABASE BACKEND    │
│  PokerChipManager │                   │                       │
│                   │                   │  ┌─────────────────┐  │
│  - buyIn          │   Events          │  │  chip-manager   │  │
│  - cashOut        │ ───────────────>  │  │  Edge Function  │  │
│  - lockChips      │                   │  └────────┬────────┘  │
│  - settleGame     │                   │           │           │
│                   │   Admin Calls     │           ▼           │
│  Owner: Admin     │ <───────────────  │  ┌─────────────────┐  │
│  Wallet (backend) │                   │  │ player_balances │  │
└───────────────────┘                   │  │ deposit_events  │  │
                                        │  │ game_settlements│  │
                                        │  └─────────────────┘  │
                                        │                       │
                                        │  ┌─────────────────┐  │
                                        │  │   poker-game    │  │
                                        │  │  Edge Function  │  │
                                        │  │                 │  │
                                        │  │  All gameplay   │  │
                                        │  │  logic here     │  │
                                        │  └─────────────────┘  │
                                        └───────────────────────┘
```

---

## Sledeći Koraci

### Faza 7: Frontend Integracija
- [ ] ChipShop komponenta (buy-in/cash-out UI)
- [ ] Integracija usePokerTable sa chip-manager
- [ ] Balance display u header-u
- [ ] Join table sa chip validacijom

### Faza 8: Contract Deployment
- [ ] Deploy na Over Testnet
- [ ] Konfiguracija backend secrets
- [ ] E2E testiranje

### Faza 9: Blockchain Listener
- [ ] Event listener za Deposit/Withdrawal evente
- [ ] Automatski sync sa baziom

---

## Admin Wallet Konfiguracija

| Info | Vrednost |
|------|----------|
| Adresa | `0x8334966329b7f4b459633696A8CA59118253bC89` |
| Uloga | Contract Owner, Settlement Signer |
| Mreža | Over Protocol Mainnet (Chain ID: 54176) |

**Secrets za konfiguraciju (Supabase):**
- `ADMIN_WALLET_PRIVATE_KEY` - Privatni ključ (NIKAD u kodu!)
- `POKER_CONTRACT_ADDRESS` - Posle deploymenta
- `WOVER_TOKEN_ADDRESS` - WOVER ERC-20 token adresa

---

## Napomene

1. **Admin wallet** je konfigurisan: `0x8334966329b7f4b459633696A8CA59118253bC89`
2. **Contract adresa** će biti u POKER_CONTRACT_ADDRESS secret posle deploymenta
3. **WOVER token adresa** će biti u WOVER_TOKEN_ADDRESS secret
4. Gameplay je potpuno off-chain, samo deposit/withdraw su on-chain
5. Settlement se za sada radi samo u bazi, on-chain settlement je prepared ali nije aktivan
