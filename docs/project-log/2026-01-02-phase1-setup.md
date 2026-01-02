# O'Rocket Hold'em - Project Log

## 2026-01-02 - Faza 2: Lobby sistem

### Šta je urađeno:
1. **Lobby stranica** (`/lobby`)
   - Lista stolova sa mock podacima
   - Filteri: Svi / 5 igrača / 6 igrača
   - Refresh dugme
   - Broj stolova prikaz

2. **TableCard komponenta**
   - Prikaz imena stola, statusa (čeka/u toku)
   - Vizuelni indikator popunjenosti (dots)
   - Blindovi i prosečan pot
   - Join dugme (disabled ako je pun)

3. **Create Table modal**
   - Ime stola input
   - Izbor broja igrača (5/6)
   - Izbor blindova (5/10 do 100/200)
   - Validacija i toast poruke

4. **Table stranica** (`/table/:id`)
   - Placeholder za poker sto
   - Poker felt pozadina
   - Back dugme ka lobiju

5. **TypeScript tipovi**
   - PokerTable, Player, TableSeat, Card, GameState
   - Sve u `src/types/poker.ts`

### Rute:
- `/` - Landing page
- `/lobby` - Lista stolova
- `/table/:id` - Poker sto (placeholder)

### Mock podaci:
- 6 stolova sa različitim parametrima
- Različiti statusi (waiting/playing)
- Različiti blindovi

### Sledeći koraci (Faza 3):
- [ ] Vizuelni poker sto sa mestima
- [ ] Karte komponente (face/back)
- [ ] Betting kontrole (Fold, Check, Call, Raise, All-in)
- [ ] Pot display
- [ ] Dealer button

---

## 2026-01-02 - Faza 1: Početak projekta

### Šta je urađeno:
1. **i18n setup**
   - Instaliran react-i18next i i18next
   - Napravljeni translation fajlovi za srpski (sr.json) i engleski (en.json)
   - Podešena i18n konfiguracija sa srpskim kao default jezikom

2. **Dark Poker Theme**
   - Kreiran custom poker theme u index.css
   - Dodati poker-specific colors (felt, gold, chips)
   - Fontovi: Orbitron (headings) + Rajdhani (body)
   - Keyframe animacije za karte i čipove

3. **Wallet integracija**
   - Instaliran ethers.js v5.7.2
   - Napravljen useWallet hook sa MetaMask podrškom
   - OverProtocol Mainnet konfiguracija (Chain ID: 54176)
   - WOVER balance prikaz

4. **Layout i komponente**
   - Header sa logo, navigacijom, language switcher, wallet connect
   - Landing page (Index.tsx) sa hero sekcijom
   - LanguageSwitcher komponenta
   - WalletContext za globalni wallet state

5. **Docs folder struktura**
   - docs/project-log/ - evidencija napretka
   - docs/contracts/ - za ABI i contract adrese
   - docs/design/ - za dizajn reference

### OverProtocol Network Config:
```
Chain ID: 54176
RPC URL: https://rpc.mainnet.overprotocol.com
Currency: OVER
Explorer: https://scan.overprotocol.com
```

---

## Contract adrese (dodati posle deploya):
- PokerChipManager: `[TBD]`
- Admin Wallet: `[TBD]`
