# os-pirata

A round-by-round scorekeeper for **Skull King** (Grandpa Beck's Games). Set the rules your table
actually plays, log bids, tricks and bonuses each round, and let the ledger do the arithmetic.

No accounts, no server, no sync: every game lives in this browser's `localStorage`, and nothing
leaves the device.

## What it does

- **Per-game rules.** Standard (20 per trick / −10 off) or Rascal scoring (10 per card, half credit
  if you miss by one). Bonuses on or off, bonuses that only count on a made bid, pirate abilities,
  cannonball/grapeshot.
- **Per-game deck.** The base deck is always in; pick any combination of the expansion and advanced
  cards — extra 7s/8s/0-14s, the wild 15, Mary Thorne, the first mate, kraken, white whale, spotted
  stingray, Davy Jones' locker, walk the plank, the last volley and loot. The round sheet only asks
  for bonuses that are actually in play.
- **Round entry.** Bid and tricks per player, bonus counters for every scoring card, an Rascal of
  Roatan wager, plus a trick tally so you can see a round that doesn't add up.
- **Admin overrides.** Override any player's points for a single round, or adjust a final total in
  Setup. Overrides are tagged everywhere they apply.
- **History.** Round-by-round log with edit-in-place, and a score-evolution chart per player.
- **Round structures.** Classic 1→10, even keeled, skip to the brawl, swift-n-salty, broadside
  barrage, whirlpool, past your bedtime, or a custom list of card counts.
- **Mobile first.** Built at 320 px up, with a bottom action bar and thumb-sized steppers for the
  phone that's on the table. Desktop gets a two-column table view.

## Scoring implemented

| Situation | Standard | Rascal |
| --- | --- | --- |
| Exact bid, bid > 0 | 20 × tricks | 10 × cards |
| Bid 0, no tricks | 10 × cards | 10 × cards |
| Off by one | −10 × 1 | half of 10 × cards |
| Off by two or more | −10 × difference | 0 |
| Cannonball, exact bid | — | 15 × cards |
| Cannonball, missed | — | 0 |

Bonuses (only when the bid is made, unless you switch that off): colour 14 = 10, black 14 = 20,
mermaid taken by a pirate = 20, pirate taken by the Skull King = 30, Skull King taken by a mermaid =
40, first mate taken = 30, expansion 8 = +5, expansion 7 = −5, sea monster destroyed by Davy Jones =
20, loot alliance = 20 each. Rascal of Roatan's wager is ±10/20 on the bid.

Rules were taken from the official Skull King rulebook, the quick reference card and the expansion
rulebook supplied with the game.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview
```

## Stack

Vite + React 19 + TypeScript, hand-written CSS with OKLCH design tokens (no UI framework), a small
SVG chart component, and `localStorage` for persistence. Deployed as a static site on Vercel.

## Layout

```
src/
  lib/       types, scoring engine (rules.ts), storage, formatting
  components/ round sheet, score chart, shared UI
  screens/   home, new-game setup, game (table / rounds / setup)
  styles/    tokens.css, app.css
```
