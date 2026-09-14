# Dota 2 Draft

Telegram Mini App that answers one question: **who should I take as the last pick?**

Enter the five enemy heroes and your four allies — the app ranks every remaining hero,
explains why, and shows what to buy against that draft.

**Live:** https://dota-lastpick.vercel.app

## What it does

- **Last pick suggestions** — every candidate scored against the enemy draft, broken
  down into counter, synergy and meta.
- **Sample confidence** — each matchup shows how many games it is based on and the
  margin of error, so a real edge is distinguishable from noise.
- **Item builds** — popular purchases per hero, filtered per position, components hidden.
  Tap an item to see what it does.
- **Against the enemy draft** — what winners actually built against these heroes,
  ranked by how much more often an item appears than usual: Monkey King Bar shows up
  +172% against Phantom Assassin, Silver Edge +74% against Spectre. Curated rules sit
  below and explain why.
- **Position filter** — Carry, Mid, Offlane, Support, Hard Support.

## How the score works

`src/lib/score.ts`:

```
score = w_counter · counter + w_synergy · synergy + w_meta · meta
```

**Counter** — average advantage against the picked enemies. The expected win rate
(derived from both heroes' baselines) is subtracted from the raw one, otherwise every
strong hero of the patch would look like a counter to everything. Small samples are
shrunk by `games / (games + 300)`.

**Synergy** — curated hero combos plus role gaps in your team and missing damage type.

**Meta** — the hero's baseline win rate in the selected rank bracket.

All three weights are adjustable in the UI.

## Data

The frontend calls OpenDota directly from the browser (they send
`Access-Control-Allow-Origin: *`), so there is no backend.

| Data | Endpoint | Cache |
|---|---|---|
| Heroes, win rates per bracket | `/heroStats` | 24 h |
| Hero matchups | `/heroes/{id}/matchups` | 12 h |
| Starting items | `/heroes/{id}/itemPopularity` | 12 h |
| Item constants | `/constants/items` | 7 days |

Rate limit without a key is 60 req/min and 2000/day, so everything is cached in
`localStorage` (`src/api/cache.ts`). An optional key goes into `VITE_OPENDOTA_KEY`.

### Known limitation

OpenDota computes matchups only from parsed matches — a fraction of a percent of all
games. In practice a hero pair has a few dozen games: 71 games means ±11.6 percentage
points, 22 games means ±20.9. Those numbers are close to noise, which is why the UI
shows sample size and marks unreliable rows instead of hiding the problem.

Baseline stats are solid — `/heroStats` aggregates ~43M picks across rank brackets.

STRATZ would fix this (full match coverage plus real pair synergy), but their API
requires an account with 100 public matches.

Matchups, pair synergy, core items and counter-items come from `public/stats.json` —
our own aggregate over raw Steam matches (`scripts/collect.mjs`), refreshed nightly by
a GitHub Action. OpenDota covers hero metadata and starting purchases.

## Curated data

These have no API and are maintained by hand:

- `src/data/positions.ts` — hero positions 1–5. OpenDota returns only roles like
  Carry/Durable/Nuker, which do not map to positions.
- `src/data/synergy.ts` — hero pair combos. The API has hero-vs-hero only.
- `src/data/itemCounters.ts` — what to buy against specific enemies.
- `src/data/itemRoles.ts` — which items suit which position, used to filter builds.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
```

Vercel rebuilds on every push to `main` (`vercel.json`).

## Telegram bot

The bot only opens the Mini App — the app itself is static and works standalone.

```bash
cp .env.example .env   # BOT_TOKEN from @BotFather, WEBAPP_URL (https)
npm run bot:setup      # registers the menu button once and exits
```

The menu button lives on Telegram's servers, so nothing has to keep running.
`npm run bot` additionally replies to `/start` while the process is up.

## Structure

```
src/
  api/          OpenDota client, localStorage cache
  data/         curated rules: positions, combos, counter items, item roles
  hooks/        data loading
  lib/score.ts  ranking algorithm
  components/   draft, hero picker, suggestion cards, builds
bot/bot.mjs     zero-dependency bot
```
