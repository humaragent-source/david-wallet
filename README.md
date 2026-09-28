# David — self-custodial wallet for the hardest assets in the world (v1, testnet)

Phone-first web app recreating the David Figma prototype. Buy tokenised gold, silver, oil, BTC and
tokenised stocks with stablecoins, borrow against them, and vault them or have them delivered.

**Live:** https://humaragent-source.github.io/david-wallet/ · **Testnet only — no real money.**

## What is real
- **Privy email login** (6-digit OTP, headless `useLoginWithEmail`) and a **Privy embedded
  self-custodial wallet** on **Base Sepolia** (chain 84532). Public App ID only — no app secret.
- Receive screen shows your real embedded-wallet address + QR; account screen reads your real
  Base Sepolia ETH balance over public RPC and can sign a test message with the embedded key.
- **Live spot prices** for gold (XAU), silver (XAG) and BTC from `api.gold-api.com` (falls back to a
  labelled demo price if the request fails).
- DeviceMotion shake detection on iPhone (permission requested on tap), tap fallback on desktop.

## What is simulated (clearly labelled in the UI)
- All balances (tokenised gold/silver/oil/BTC/stocks, test USDT), buys/sells, sends, withdrawals,
  loans, card issuance, vault storage and home delivery. Stored in `localStorage` only.
- Oil and tokenised-stock prices, historical chart curves, leaderboard players.

## Screens (hash routes)
`#/welcome` onboarding · `#/signin` email + OTP · `#/gold` gold home · `#/claim/coin` coin cracks →
claim sheet (Vault / Truck / Home) · `#/graduate` Tier 2 gold pour → claim · `#/tiers` ·
`#/cards` → `#/cards/tiers` → `#/cards/details` · `#/shake` Shake 'n' Earn · `#/leaderboard` ·
`#/rush` Gold Rush · `#/loans` · `#/assets` · `#/asset/{silver|oil|btc|tsla|aapl|nvda}` ·
`#/trade/{asset}` stablecoin ticket · `#/send` · `#/receive` · `#/withdraw` · `#/profile`.
The ⋮ menu on the gold home has demo controls (fill coin, graduate, Gold Rush, reset).

Design references from the Figma prototype live in [`/design-refs`](design-refs).

## Develop
```bash
npm ci
npm run dev          # http://localhost:5173/david-wallet/
npm run build        # outputs dist/
```
Deploy: `./deploy.sh` builds and force-publishes `dist/` to the `gh-pages` branch, which GitHub Pages serves.
(An Actions workflow alternative is in `docs/github-pages-workflow.yml.example`.)

## Privy setup note
If you restrict **Allowed domains** in the Privy dashboard, add `https://humaragent-source.github.io`
(and `http://localhost:5173` for local dev).
