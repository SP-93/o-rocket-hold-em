# O'Rocket Hold'em - Project Log

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

### Sledeći koraci (Faza 2):
- [ ] Lobby stranica sa listom stolova
- [ ] Create table modal
- [ ] Supabase integracija za stolove
- [ ] Join table funkcionalnost

### Bitne odluke:
- Srpski jezik je default (korisnici su većinom iz Srbije)
- Dark mode only (poker estetika)
- MetaMask only za sada (može se proširiti kasnije)

---

## Contract adrese (dodati posle deploya):
- PokerChipManager: `[TBD]`
- Admin Wallet: `[TBD]`
