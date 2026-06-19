<div align="center">

# ARC ECOSYSTEM

### One USDC economy. Three apps. Twenty-five features. Zero gas tokens.

A complete Web3 ecosystem for **stablecoin payments, creator monetization, and on-chain gaming** -- built natively on Arc Network, settling everything in USDC with sub-cent fees and sub-second finality.

[![Live](https://img.shields.io/badge/Live-arc--ecosystem.vercel.app-d4af37?style=for-the-badge)](https://arcecosystemmain.vercel.app)
[![Network](https://img.shields.io/badge/Arc%20Testnet-5042002-30d158?style=for-the-badge)](https://testnet.arcscan.app)
[![Circle](https://img.shields.io/badge/Powered%20by-Circle%20AppKit-185fa5?style=for-the-badge)](https://www.circle.com)

**[Live Demo](https://arcecosystemmain.vercel.app)** - **[Gogo AI Chat](https://arcecosystemmain.vercel.app/chat)** - **[Prediction Market](https://arcecosystemmain.vercel.app/predict)**

**[Arc Pay](https://arcpaymain.vercel.app)** - **[Arc Creator](https://arccreatormain.vercel.app)** - **[Arc Play](https://arcarcade.vercel.app)** - **[Arc Payouts](https://arc-payouts.vercel.app)**

</div>

---

## Table of Contents

1. [The Big Idea](#-the-big-idea)
2. [Hackathon Tracks](#-hackathon-tracks)
3. [System Architecture](#-system-architecture)
4. [The Four Apps](#-the-four-apps)
5. [Flagship: Prediction Market Agent](#-flagship-prediction-market-agent)
6. [Circle Products Used](#-circle-products-used)
7. [Tech Stack](#-tech-stack)
8. [Arc Network Details](#-arc-network-details)
9. [Repository Structure](#-repository-structure)
10. [Getting Started](#-getting-started)
11. [Deployment](#-deployment)
12. [Feature Matrix](#-feature-matrix)
13. [Roadmap](#-roadmap)
14. [Circle Product Feedback](#-circle-product-feedback)
15. [The Story](#-the-story)
16. [Built By](#-built-by)

---

## The Big Idea

Most Web3 apps force users to juggle two tokens: a gas token to pay fees and a stablecoin to actually transact. **Arc removes that friction** -- USDC *is* the gas token. We built an entire economy on top of that single insight.

**Arc Ecosystem** is not one app. It's a unified network of three consumer products plus a central hub, all sharing the same wallet, the same token, the same design language, and the same payment rail:

| Pillar | App | What it solves |
|:------:|-----|----------------|
| **01 - Payments** | Arc Pay | Send, split, invoice, payroll, escrow -- all in USDC |
| **02 - Monetization** | Arc Creator | Tips, subscriptions, bounties, marketplace |
| **03 - Gaming + DeFi** | Arc Play | Prediction markets, raffles, launchpad, 10+ games |
| **00 - Hub** | Arc Landing | Discovery, AI assistant, voice tour, community |

Every payment across all four apps settles in **native USDC on Arc Testnet** -- peer-to-peer, instant, sub-cent.

---

## Hackathon Tracks

This project targets **multiple tracks** of the Stablecoin Commerce Stack Challenge:

### [x] Track 1 -- Cross-Border Payments & Remittances
**Arc Pay** delivers instant, low-cost USDC payments with transparent fees and real-time settlement confirmation. Global payroll (batch CSV), freelancer payouts, marketplace settlement, and split-bill flows -- all settled on-chain in under a second for less than a cent.

### [x] Track 4 -- Agentic Economy
**Prediction Market Agent** is a fully autonomous on-chain settlement system. A funded Circle Agent Wallet holds all bets in escrow and **automatically pays out winners on-chain** when a market resolves -- no human signs the payout. The agent reasons over the resolved outcome, computes the winning pool, and executes USDC transfers programmatically. *(See [flagship section](#-flagship-prediction-market-agent).)*

### [~] Track 2 -- SME Trade Finance (partial)
**Arc Creator's** Bounty Board and Trust Escrow implement milestone-based settlement with proof-of-delivery triggers -- the building blocks of working-capital workflows.

---

## System Architecture

```
                          +-----------------------------+
                          |   Users (Browser + MetaMask) |
                          +--------------+--------------+
                                         |
              +--------------------------+--------------------------+
              |                          |                          |
       +------v------+          +--------v--------+         +-------v-------+
       |   ARC PAY   |          |   ARC CREATOR   |         |   ARC PLAY    |
       |  Payments   |          |  Monetization   |         | Gaming + DeFi |
       +------+------+          +--------+--------+         +-------+-------+
              |                          |                          |
              +--------------------------+--------------------------+
                                         |
                       +-----------------+-----------------+
                       |        SHARED INFRASTRUCTURE       |
                       |                                    |
                       |   Circle AppKit      Agent Wallet  |
                       |   kit.send()         auto-settle   |
                       +-----------------+-----------------+
                                         |
                          +--------------v--------------+
                          |   USDC (native, 18 decimals) |
                          |   gas token + settlement     |
                          +--------------+--------------+
                                         |
                          +--------------v--------------+
                          |   ARC TESTNET -- chain 5042002 |
                          |   sub-cent fees - <1s finality|
                          |   rpc.testnet.arc.network     |
                          +-----------------------------+
```

### Data & State Layers

| Layer | Technology | Used for |
|-------|-----------|----------|
| **On-chain settlement** | Circle AppKit + viem | All real USDC transfers |
| **Agent settlement** | viem + `privateKeyToAccount` | Automated winner payouts |
| **Server state** | Upstash Redis (Vercel KV) | Markets, bets, profiles, tx ticker |
| **Client state** | Zustand + persist | Game scores, challenges, market listings |
| **Auth** | X (Twitter) OAuth 2.0 PKCE | Creator profiles |
| **AI** | Google Gemini 2.5 Flash | Assistant + voice tour |

---

## The Four Apps

### 💸 Arc Pay -- Payments
> *"Send USDC instantly. No banks, no delays."*

| Feature | Description | Status |
|---------|-------------|:------:|
| **QR Payment** | Generate & scan QR codes for instant USDC payments | [x] |
| **Split the Bill** | Divide expenses across multiple recipients | [x] |
| **Invoice + PDF** | Professional invoices with downloadable PDF export | [x] |
| **Payroll (Batch)** | Bulk CSV payouts -- pay an entire team in one flow | [x] |
| **Trust Escrow** | Milestone-based secure payments (6 lifecycle states) | [x] |

**Proven on-chain:** A real 10 USDC batch payroll transaction was executed and verified on ArcScan.

---

### 🎨 Arc Creator -- Monetization
> *"Monetize your creativity with USDC."*

| Feature | Description | Status |
|---------|-------------|:------:|
| **Tip Jar** | Public `/tip/[handle]` page -- fans tip creators in USDC | [x] |
| **Subscription** | Recurring creator plans with expiry tracking | [x] |
| **Bounty Board** | Upwork-style: post task → hunters bid → pick winner → pay on approval | [x] |
| **Freelance Marketplace** | Fiverr-style service listings with 3 pricing modes (single / tiered / hourly) and escrow checkout | [x] |

---

### 🎮 Arc Play -- Gaming + DeFi
> *"Play, predict, profit on-chain."*

| Feature | Description | Status |
|---------|-------------|:------:|
| **Prediction Market** | Polymarket-style YES/NO markets with autonomous agent settlement | [x] |
| **NFT Raffle** | Provably-random raffles with USDC pots and NFT prizes | [x] |
| **Portfolio Tracker** | Track USDC balance, transactions, and monthly on-chain stats | [x] |
| **Play to Earn** | 3 mini-games (Click Rush, Memory Match, Reaction Test) with USDC leaderboards | [x] |
| **Token Launchpad** | Launch tokens on Arc, 3 modes (Basic / Allocation / IDO) | [~] |

---

### Arc Landing -- The Hub
> *"Three apps. One network language."*

The central discovery experience that ties the ecosystem together.

| Feature | Description | Status |
|---------|-------------|:------:|
| **10+ Browser Games** | Minesweeper, Quiz, Solitaire, Word Guess, Word Connect, Red Ball, Fruit Ninja, Bubble Shooter, Candy Crush, Bomberman | [x] |
| **USDC Challenge System** | Beat a game → challenge a friend → loser's wager goes to winner | [x] |
| **Gogo AI Assistant** | Gemini-powered chat agent that executes conditional USDC payments from natural language ("send 5 to alice if...") | [x] |
| **Voice Tour** | Narrated text-to-speech walkthrough of all apps | [x] |
| **Arc Market** | Demo marketplace with category/city/price filters & Arc Pay checkout | [x] |
| **Arc Events** | Community calendar with RSVP, ICS export, Google Calendar | [x] |
| **Architecture Map** | Live visual of how value routes across the ecosystem | [x] |
| **X OAuth Login** | Connect X to claim a creator profile | [x] |
| **EN / TR i18n** | Full English & Turkish localization | [x] |
| **SDK Showcase** | `arc-kit` integration teaser ("embed Arc Pay in 3 lines") | [x] |
| **FAQ + Roadmap + Glossary** | Full educational content surfaces | [x] |

---

### 🌍 Arc Global Payouts -- The Companion SaaS
> *"Batch USDC payouts for global teams."*

**Live:** [arc-payouts.vercel.app](https://arc-payouts.vercel.app) · **Repo:** [GoGoSns/arc-payouts](https://github.com/GoGoSns/arc-payouts)

Arc Payouts is the production-grade payout platform that the entire ecosystem grew out of. It is a standalone SaaS dashboard for companies and agencies to pay freelancers, remote employees, and global vendors in USDC — the cross-border remittance use case Arc was designed for. It pioneered the wallet, payment, and design patterns now shared across Arc Pay, Creator, and Play.

| Feature | Description | Status |
|---------|-------------|:------:|
| **X OAuth Profiles** | Login with X (PKCE), profiles saved to Redis | [x] |
| **Pay Links** | Anonymous `/pay/[username]` USDC payment pages — no account needed | [x] |
| **Batch CSV Payouts** | Upload a CSV, pay an entire payroll of recipients in one flow | [x] |
| **Live Transaction Ticker** | Real-time on-chain payment feed via Redis | [x] |
| **NFT Receipts** | On-chain payment receipts minted as NFTs via Pinata / IPFS | [x] |
| **Groq AI Chat** | In-app AI assistant routed server-side | [x] |
| **USDC Tetris** | Mini-game with a friend-challenge / wager system | [x] |

**Why it matters:** Arc Payouts is where the **first real on-chain USDC transfer** was executed and verified on ArcScan, proving the Circle AppKit + Arc Testnet stack end-to-end. It directly addresses Track 1 (cross-border payments & remittances): a UAE-style agency can pay global sellers, creators, and contractors in USDC with transparent fees and real-time settlement.

---

## Flagship: Prediction Market Agent

This is the crown jewel -- a **fully autonomous, on-chain prediction market** where an AI agent settles payouts with zero human intervention. Every cent is real USDC.

### How it works

```
   1. CREATE          2. BET                3. RESOLVE           4. AUTO-SETTLE
+--------------+  +------------------+  +--------------+  +--------------------+
| Admin posts  |  | User picks YES/NO |  | Admin reveals|  | Agent Wallet pays  |
| a market via |->| Real USDC sent to |->| the outcome  |->| winners on-chain   |
| ADMIN_SECRET |  | Agent Wallet      |  | (YES or NO)  |  | automatically      |
+--------------+  +------------------+  +--------------+  +--------------------+
                   escrowed in agent      /api/predict/      privateKeyToAccount
                                          settle             + sendTransaction
```

### Why this matters for the Agentic Economy track

- **No human signs the payout.** When a market resolves, `/api/predict/settle` loads the agent's private key from a server-side environment variable, computes the winning pool, and executes real USDC transfers to every winner -- programmatically, on-chain.
- **The agent wallet is sovereign.** It holds all escrowed bets. The admin cannot touch user funds directly; only the agent's settlement logic can release them.
- **Everything is real.** No simulated hashes, no mock transfers. Every bet is a verifiable on-chain transaction (`View TX` → ArcScan).

### Verified live test

A real bet was placed and confirmed on Arc Testnet during testing:
- Market: *"Will Arc Mainnet launch before Q3 2026?"*
- Bet: 1 USDC on YES → escrowed in Agent Wallet
- Network fee: **0.0011 USDC** (sub-cent, as promised)
- Result: `Bet placed successfully -- Tx: 0x9c9cbfbd...` [x]

### Technical files

| File | Role |
|------|------|
| `app/predict/page.tsx` | Market UI -- connect, bet, admin resolve panel |
| `lib/predictionStore.ts` | Redis-backed market & bet state |
| `app/api/predict/create` | Admin creates a market (gated by `ADMIN_SECRET`) |
| `app/api/predict/bet` | Records a bet after on-chain transfer |
| `app/api/predict/settle` | **Agent auto-pays winners** via `privateKeyToAccount` + `sendTransaction` |
| `app/api/predict/active` | Fetches the active market + all bets |

---

## Circle Products Used

### 1. USDC -- Primary Settlement Rail
Every transaction across all four apps settles in **native USDC** on Arc Testnet (18 decimals, contract `0x3600000000000000000000000000000000000000`). USDC serves a dual role: it's both the **gas token** and the **payment currency**, eliminating the need for users to hold any second asset.

### 2. Circle AppKit (`@circle-fin/app-kit`)
The core payment SDK. Paired with `@circle-fin/adapter-viem-v2`, it powers every user-initiated USDC transfer:

```typescript
const { AppKit } = await import('@circle-fin/app-kit');
const { createViemAdapterFromProvider } = await import('@circle-fin/adapter-viem-v2');

const kit = new AppKit();
const adapter = await createViemAdapterFromProvider({
  provider: (window as any).ethereum,
});

const res = await kit.send({
  from: { adapter, chain: 'Arc_Testnet' as never },
  to: recipientAddress,
  amount: '10.00',
  token: 'USDC',
});
```

This single pattern, discovered and battle-tested across three projects, powers QR payments, invoices, payroll batches, escrow releases, tips, subscriptions, and prediction-market bets.

### 3. Circle Agent Wallet -- Programmable Settlement
A dedicated, funded wallet that the Prediction Market Agent uses to **autonomously settle payouts on-chain**. The private key lives only in server-side environment variables; settlement is executed by `viem`'s `privateKeyToAccount` + `sendTransaction`. This is the foundation of our Agentic Economy submission.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router, Turbopack) | 16.2.4 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4 |
| **Monorepo** | pnpm workspaces + Turborepo | pnpm 10.33.2 / turbo 2.9.6 |
| **Web3 core** | wagmi + viem | 3.6.5 / 2.47 |
| **Payments** | @circle-fin/app-kit + adapter-viem-v2 | latest |
| **Wallet** | MetaMask (injected connector) | -- |
| **Server state** | Upstash Redis (via Vercel KV) | -- |
| **Client state** | Zustand (persist middleware) | -- |
| **Auth** | X (Twitter) OAuth 2.0 PKCE | -- |
| **AI** | Google Gemini 2.5 Flash | -- |
| **PDF / CSV / QR** | jspdf, papaparse, qrcode.react, @yudiel/react-qr-scanner | -- |
| **Icons** | lucide-react | -- |
| **Font** | Space Grotesk | -- |
| **Deploy** | Vercel | -- |

---

## Arc Network Details

| Property | Value |
|----------|-------|
| **Chain ID** | `5042002` (`0x4cef52`) |
| **RPC** | `https://rpc.testnet.arc.network` |
| **Explorer** | `https://testnet.arcscan.app` |
| **Gas Token** | USDC (native) |
| **USDC Decimals** | 18 |
| **USDC Contract** | `0x3600000000000000000000000000000000000000` |
| **Block Time** | < 1 second |
| **Finality** | Deterministic, sub-second |
| **Fees** | Sub-cent (~ 0.001 USDC per tx) |
| **Faucet** | `faucet.circle.com` |

> **Key discovery:** On Arc Testnet, USDC is a *native* token (used via the `value` field), not a standard ERC-20. Transfers use `parseUnits(amount, 18)`. Circle AppKit functions only on deployed environments (Vercel) -- local development uses a mock transfer path, then real transfers are verified post-deploy.

---

## Repository Structure

```
arc-ecosystem/
+-- apps/
|   +-- arc-landing/     # Hub: games, market, events, prediction, AI, voice tour
|   |   +-- app/
|   |   |   +-- game/<name>/page.tsx     # 10+ browser games
|   |   |   +-- predict/page.tsx         # Prediction Market UI
|   |   |   +-- market/                  # Arc Market
|   |   |   +-- events/                  # Arc Events
|   |   |   +-- api/predict/             # create - bet - settle - active
|   |   |   +-- api/assistant/           # Gemini AI
|   |   |   +-- api/auth/                # X OAuth
|   |   +-- components/
|   |   |   +-- ChallengeModal.tsx       # USDC wager system
|   |   |   +-- ChallengeBar.tsx
|   |   |   +-- SiteFooter.tsx
|   |   |   +-- VoiceTour.tsx
|   |   +-- lib/
|   |       +-- usdcTransfer.ts          # Circle AppKit send pattern
|   |       +-- predictionStore.ts       # Redis market/bet state
|   |       +-- challengeStore.ts        # Zustand challenge state
|   |       +-- marketStore.ts
|   +-- arc-pay/         # QR - Split - Invoice - Payroll - Escrow
|   +-- arc-creator/     # Tip - Subscription - Bounty - Marketplace
|   +-- arc-play/        # Prediction - Raffle - Portfolio - Launchpad
+-- package.json         # packageManager: pnpm@10.33.2
+-- pnpm-workspace.yaml
+-- turbo.json
+-- .npmrc               # fetch-timeout=300000
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 10+
- MetaMask browser extension
- Arc Testnet USDC -- get it from [faucet.circle.com](https://faucet.circle.com)

### MetaMask network setup
| Field | Value |
|-------|-------|
| Network name | Arc Testnet |
| RPC URL | `https://rpc.testnet.arc.network` |
| Chain ID | `5042002` |
| Currency symbol | USDC |
| Block explorer | `https://testnet.arcscan.app` |

### Installation
```bash
git clone https://github.com/GoGoSns/arc-ecosystem.git
cd arc-ecosystem
pnpm install
```

### Environment variables
Create `.env.local` in each app directory:
```env
# AI
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key

# X OAuth (Arc Creator profiles)
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Upstash Redis (markets, bets, profiles)
KV_REST_API_URL=your_upstash_url
KV_REST_API_TOKEN=your_upstash_token

# Prediction Market Agent (arc-landing only)
AGENT_WALLET_ADDRESS=0x6d8ac2ebd38788b769ae38fd02cc56dfab6b7a88
AGENT_PRIVATE_KEY=your_agent_private_key
ADMIN_SECRET=your_admin_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

### Run all apps
```bash
pnpm dev
```
| App | Port |
|-----|------|
| Arc Landing | http://localhost:3003 |
| Arc Pay | http://localhost:3000 |
| Arc Creator | http://localhost:3001 |
| Arc Play | http://localhost:3002 |

### Build
```bash
pnpm build                                      # all apps
pnpm build --filter @arc-ecosystem/arc-landing  # single app
```

---

## Deployment

All four apps deploy independently from the same monorepo on Vercel (root directory set per project):

| App | Root Directory | Live URL |
|-----|---------------|----------|
| Arc Landing | `apps/arc-landing` | [arcecosystemmain.vercel.app](https://arcecosystemmain.vercel.app) |
| Arc Pay | `apps/arc-pay` | [arcpaymain.vercel.app](https://arcpaymain.vercel.app) |
| Arc Creator | `apps/arc-creator` | [arccreatormain.vercel.app](https://arccreatormain.vercel.app) |
| Arc Play | `apps/arc-play` | [arcarcade.vercel.app](https://arcarcade.vercel.app) |

**Related live project:** [Arc Global Payouts](https://arc-payouts.vercel.app) (`arc-payouts.vercel.app`) — the predecessor USDC payout SaaS with batch CSV, NFT receipts via IPFS, and the first verified on-chain USDC transfer that proved the stack.

---

## Feature Matrix

| | Arc Pay | Arc Creator | Arc Play | Arc Landing |
|--|:--:|:--:|:--:|:--:|
| Real USDC transfers | ✅ | ✅ | ✅ | ✅ |
| Circle AppKit | ✅ | ✅ | ✅ | ✅ |
| Agent auto-settlement | ⬜ | ⬜ | ✅ | ✅ |
| QR / Invoice / PDF | ✅ | ⬜ | ⬜ | ⬜ |
| Batch payroll (CSV) | ✅ | ⬜ | ⬜ | ⬜ |
| Escrow | ✅ | ✅ | ⬜ | ⬜ |
| Tips / Subscriptions | ⬜ | ✅ | ⬜ | ⬜ |
| Prediction market | ⬜ | ⬜ | ✅ | ✅ |
| Browser games | ⬜ | ⬜ | ✅ | ✅ |
| USDC challenge wagers | ⬜ | ⬜ | ⬜ | ✅ |
| AI assistant | ✅ | ✅ | ✅ | ✅ |
| X OAuth | ⬜ | ⬜ | ⬜ | ✅ |
| EN/TR i18n | ⬜ | ⬜ | ⬜ | ✅ |

**Total: 25+ shipped features across the ecosystem.**

---

## Roadmap

### [x] Phase 0 -- MVP (shipped)
- Three consumer apps + hub, all live on Vercel
- Real USDC settlement via Circle AppKit, verified on ArcScan
- Autonomous Prediction Market Agent with on-chain auto-settlement
- 10+ games, challenge system, market, events, AI assistant, voice tour

### [~] Phase 1 -- Smart Contracts (next)
- Move escrow, prediction, and raffle logic from trust-based to **on-chain smart contracts**
- ERC-8004 agent identity & reputation registries (`IdentityRegistry`, `ReputationRegistry`, `ValidationRegistry`)
- Cross-user challenge system backed by Redis (currently per-browser localStorage)

### [ ] Phase 2 -- Expansion
- CCTP / Bridge Kit for cross-chain USDC inflow
- Circle Gateway for treasury routing & multi-party settlement
- Nanopayments for high-frequency game micro-wagers
- Native mobile apps (iOS + Android)

### [ ] Phase 3 -- Maturity
- Arc Mainnet migration
- Arc SDK v1 (`arc-kit`) published to npm -- "embed Arc Pay in 3 lines"
- Arc DAO governance, Cross-chain Bridge, Lending, Identity layer

---

## Circle Product Feedback

### Why we chose these products
We chose **Circle AppKit + USDC** because Arc Network is purpose-built for stablecoin commerce. USDC as the native gas token eliminates the dual-token UX problem entirely -- users need exactly one asset for everything. Circle AppKit gives us a clean, typed `kit.send()` primitive that abstracts away the RPC instability we hit early on with raw `eth_sendTransaction`. The **Agent Wallet** was the natural fit for our Agentic Economy track: a sovereign, programmatic signer that settles payouts without a human in the loop.

### What worked well
- **USDC as native gas** -- the single biggest UX win. No "go buy ETH to pay gas" step. Tips, micro-wagers, and subscriptions all become economically viable.
- **`kit.send()` reliability** -- once deployed, the pattern is rock-solid and type-safe. It solved the RPC transaction failures that blocked us when using MetaMask's raw RPC directly.
- **Sub-cent fees** -- a real bet cost **0.0011 USDC** in network fees. This makes an entire class of micro-economy features possible.
- **Sub-second finality** -- payments feel instant. There's no "pending" anxiety; the confirmation is effectively immediate.

### What could be improved
- **AppKit localhost limitation** -- AppKit only functions on deployed environments (Vercel), not localhost. This forced us to maintain a mock transfer path for local dev and only verify real transfers after each deploy, which significantly slowed our iteration loop.
- **Documentation gaps on Arc specifics** -- we discovered through trial and error that Arc Testnet's USDC is a *native* token with **18 decimals** (not the standard 6, not a standard ERC-20). This cost real debugging time. Initially we also wasted effort on Reown AppKit (@reown/appkit) before learning Circle's KIT_KEY format is incompatible with WalletConnect.
- **RPC stability** -- the public RPC (`rpc.testnet.arc.network`) was reliable for reads but flaky for raw transaction submission early on; AppKit masked this, but the underlying instability tripped up MetaMask network setup (a stale `rpc.drpc` endpoint returned a mismatched chain ID).
- **Agent Wallet onboarding** -- setting up a funded programmable wallet for autonomous settlement could be far more streamlined for hackathon timelines.

### Recommendations
- Ship a **local AppKit dev mode** that simulates transactions without requiring a deploy.
- Publish an **Arc Testnet quick-start** that explicitly states USDC is native + 18 decimals, with copy-paste MetaMask config and a verified RPC endpoint.
- Add a **one-click testnet faucet** inside AppKit.
- Provide an **Agent Wallet template** repo for autonomous-settlement use cases.

---

## The Story

Arc Ecosystem grew from a single idea: if USDC is the native gas token, an entire consumer economy can live on one rail with no friction.

It began as a single USDC invoice dapp (`arc-invoice-dapp`). That became **Arc Global Payouts** (`arc-payouts.vercel.app`) -- a payout SaaS with batch CSV payments, NFT receipts via IPFS, and the first real on-chain USDC transfer that proved the stack worked. That foundation grew into this monorepo: **four apps, 25+ features, an autonomous settlement agent, and a complete design system** -- all on native USDC.

The lesson that runs through all of it: **the hard part wasn't the code, it was the discoveries** -- that Arc's USDC is native and 18 decimals, that Circle AppKit only works deployed, that the agent wallet must be sovereign from the admin. Each one is now documented above so the next builder doesn't have to rediscover it.

---

## Built By

**GoGo** -- Web3 builder

- X -- [@0xGoGochain](https://x.com/0xGoGochain)
- GitHub -- [GoGoSns](https://github.com/GoGoSns)

<div align="center">

---

**Arc Ecosystem** - Built on Arc Testnet - USDC native - One economy, three apps

*Testnet environment -- tokens have no real value.*

</div>
