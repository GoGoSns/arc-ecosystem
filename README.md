<div align="center">

# â¬¡ ARC ECOSYSTEM

### One USDC economy. Three apps. Twenty-five features. Zero gas tokens.

A complete Web3 ecosystem for **stablecoin payments, creator monetization, and on-chain gaming** â€” built natively on Arc Network, settling everything in USDC with sub-cent fees and sub-second finality.

[![Live](https://img.shields.io/badge/Live-arc--ecosystem.vercel.app-d4af37?style=for-the-badge)](https://arcecosystemmain.vercel.app/chat)
[![Network](https://img.shields.io/badge/Arc%20Testnet-5042002-30d158?style=for-the-badge)](https://testnet.arcscan.app)
[![Circle](https://img.shields.io/badge/Powered%20by-Circle%20AppKit-185fa5?style=for-the-badge)](https://www.circle.com)

**[Live Demo](https://arcecosystemmain.vercel.app/chat)** Â· **[Arc Pay](https://arcecosystemmain.vercel.app/chat)** Â· **[Arc Creator](https://arcecosystemmain.vercel.app)** Â· **[Arc Play](https://arcecosystemmain.vercel.app/predict)**

</div>

---

## â¬¡ Table of Contents

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

## â¬¡ The Big Idea

Most Web3 apps force users to juggle two tokens: a gas token to pay fees and a stablecoin to actually transact. **Arc removes that friction** â€” USDC *is* the gas token. We built an entire economy on top of that single insight.

**Arc Ecosystem** is not one app. It's a unified network of three consumer products plus a central hub, all sharing the same wallet, the same token, the same design language, and the same payment rail:

| Pillar | App | What it solves |
|:------:|-----|----------------|
| **01 Â· Payments** | Arc Pay | Send, split, invoice, payroll, escrow â€” all in USDC |
| **02 Â· Monetization** | Arc Creator | Tips, subscriptions, bounties, marketplace |
| **03 Â· Gaming + DeFi** | Arc Play | Prediction markets, raffles, launchpad, 10+ games |
| **00 Â· Hub** | Arc Landing | Discovery, AI assistant, voice tour, community |

Every payment across all four apps settles in **native USDC on Arc Testnet** â€” peer-to-peer, instant, sub-cent.

---

## â¬¡ Hackathon Tracks

This project targets **multiple tracks** of the Stablecoin Commerce Stack Challenge:

### âœ… Track 1 â€” Cross-Border Payments & Remittances
**Arc Pay** delivers instant, low-cost USDC payments with transparent fees and real-time settlement confirmation. Global payroll (batch CSV), freelancer payouts, marketplace settlement, and split-bill flows â€” all settled on-chain in under a second for less than a cent.

### âœ… Track 4 â€” Agentic Economy
**Prediction Market Agent** is a fully autonomous on-chain settlement system. A funded Circle Agent Wallet holds all bets in escrow and **automatically pays out winners on-chain** when a market resolves â€” no human signs the payout. The agent reasons over the resolved outcome, computes the winning pool, and executes USDC transfers programmatically. *(See [flagship section](#-flagship-prediction-market-agent).)*

### â— Track 2 â€” SME Trade Finance (partial)
**Arc Creator's** Bounty Board and Trust Escrow implement milestone-based settlement with proof-of-delivery triggers â€” the building blocks of working-capital workflows.

---

## â¬¡ System Architecture

```
                          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                          â”‚   Users (Browser + MetaMask) â”‚
                          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                         â”‚
              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
              â”‚                          â”‚                          â”‚
       â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”         â”Œâ”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”
       â”‚   ARC PAY   â”‚          â”‚   ARC CREATOR   â”‚         â”‚   ARC PLAY    â”‚
       â”‚  Payments   â”‚          â”‚  Monetization   â”‚         â”‚ Gaming + DeFi â”‚
       â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜          â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜         â””â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
              â”‚                          â”‚                          â”‚
              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                         â”‚
                       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                       â”‚        SHARED INFRASTRUCTURE       â”‚
                       â”‚                                    â”‚
                       â”‚   Circle AppKit      Agent Wallet  â”‚
                       â”‚   kit.send()         auto-settle   â”‚
                       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                         â”‚
                          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                          â”‚   USDC (native, 18 decimals) â”‚
                          â”‚   gas token + settlement     â”‚
                          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                         â”‚
                          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                          â”‚   ARC TESTNET â€” chain 5042002 â”‚
                          â”‚   sub-cent fees Â· <1s finalityâ”‚
                          â”‚   rpc.testnet.arc.network     â”‚
                          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
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

## â¬¡ The Four Apps

### ğŸ’¸ Arc Pay â€” Payments
> *"Send USDC instantly. No banks, no delays."*

| Feature | Description | Status |
|---------|-------------|:------:|
| **QR Payment** | Generate & scan QR codes for instant USDC payments | âœ… |
| **Split the Bill** | Divide expenses across multiple recipients | âœ… |
| **Invoice + PDF** | Professional invoices with downloadable PDF export | âœ… |
| **Payroll (Batch)** | Bulk CSV payouts â€” pay an entire team in one flow | âœ… |
| **Trust Escrow** | Milestone-based secure payments (6 lifecycle states) | âœ… |

**Proven on-chain:** A real 10 USDC batch payroll transaction was executed and verified on ArcScan.

---

### ğŸ¨ Arc Creator â€” Monetization
> *"Monetize your creativity with USDC."*

| Feature | Description | Status |
|---------|-------------|:------:|
| **Tip Jar** | Public `/tip/[handle]` page â€” fans tip creators in USDC | âœ… |
| **Subscription** | Recurring creator plans with expiry tracking | âœ… |
| **Bounty Board** | Upwork-style: post task â†’ hunters bid â†’ pick winner â†’ pay on approval | âœ… |
| **Marketplace** | Fiverr-style service listings with escrow checkout | âœ… |

---

### ğŸ® Arc Play â€” Gaming + DeFi
> *"Play, predict, profit on-chain."*

| Feature | Description | Status |
|---------|-------------|:------:|
| **Prediction Market** | YES/NO markets with autonomous agent settlement | âœ… |
| **NFT Raffle** | Provably-fair USDC + NFT raffles | âœ… |
| **Portfolio Tracker** | Track USDC balance & on-chain activity | âœ… |
| **Token Launchpad** | Launch tokens on Arc | â— |
| **Play to Earn** | Earn USDC through gameplay | â— |

---

### â¬¡ Arc Landing â€” The Hub
> *"Three apps. One network language."*

The central discovery experience that ties the ecosystem together.

| Feature | Description | Status |
|---------|-------------|:------:|
| **10+ Browser Games** | Minesweeper, Quiz, Solitaire, Word Guess, Word Connect, Red Ball, Fruit Ninja, Bubble Shooter, Candy Crush, Bomberman | âœ… |
| **USDC Challenge System** | Beat a game â†’ challenge a friend â†’ loser's wager goes to winner | âœ… |
| **Gogo AI Assistant** | Gemini-powered chat assistant for the ecosystem | âœ… |
| **Voice Tour** | Narrated text-to-speech walkthrough of all apps | âœ… |
| **Arc Market** | Demo marketplace with category/city/price filters & Arc Pay checkout | âœ… |
| **Arc Events** | Community calendar with RSVP, ICS export, Google Calendar | âœ… |
| **Architecture Map** | Live visual of how value routes across the ecosystem | âœ… |
| **X OAuth Login** | Connect X to claim a creator profile | âœ… |
| **EN / TR i18n** | Full English & Turkish localization | âœ… |
| **SDK Showcase** | `arc-kit` integration teaser ("embed Arc Pay in 3 lines") | âœ… |
| **FAQ + Roadmap + Glossary** | Full educational content surfaces | âœ… |

---

## â¬¡ Flagship: Prediction Market Agent

This is the crown jewel â€” a **fully autonomous, on-chain prediction market** where an AI agent settles payouts with zero human intervention. Every cent is real USDC.

### How it works

```
   1. CREATE          2. BET                3. RESOLVE           4. AUTO-SETTLE
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Admin posts  â”‚  â”‚ User picks YES/NO â”‚  â”‚ Admin revealsâ”‚  â”‚ Agent Wallet pays  â”‚
â”‚ a market via â”‚â”€â–¶â”‚ Real USDC sent to â”‚â”€â–¶â”‚ the outcome  â”‚â”€â–¶â”‚ winners on-chain   â”‚
â”‚ ADMIN_SECRET â”‚  â”‚ Agent Wallet      â”‚  â”‚ (YES or NO)  â”‚  â”‚ automatically      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                   escrowed in agent      /api/predict/      privateKeyToAccount
                                          settle             + sendTransaction
```

### Why this matters for the Agentic Economy track

- **No human signs the payout.** When a market resolves, `/api/predict/settle` loads the agent's private key from a server-side environment variable, computes the winning pool, and executes real USDC transfers to every winner â€” programmatically, on-chain.
- **The agent wallet is sovereign.** It holds all escrowed bets. The admin cannot touch user funds directly; only the agent's settlement logic can release them.
- **Everything is real.** No simulated hashes, no mock transfers. Every bet is a verifiable on-chain transaction (`View TX` â†’ ArcScan).

### Verified live test

A real bet was placed and confirmed on Arc Testnet during testing:
- Market: *"Will Arc Mainnet launch before Q3 2026?"*
- Bet: 1 USDC on YES â†’ escrowed in Agent Wallet
- Network fee: **0.0011 USDC** (sub-cent, as promised)
- Result: `Bet placed successfully â€” Tx: 0x9c9cbfbd...` âœ…

### Technical files

| File | Role |
|------|------|
| `app/predict/page.tsx` | Market UI â€” connect, bet, admin resolve panel |
| `lib/predictionStore.ts` | Redis-backed market & bet state |
| `app/api/predict/create` | Admin creates a market (gated by `ADMIN_SECRET`) |
| `app/api/predict/bet` | Records a bet after on-chain transfer |
| `app/api/predict/settle` | **Agent auto-pays winners** via `privateKeyToAccount` + `sendTransaction` |
| `app/api/predict/active` | Fetches the active market + all bets |

---

## â¬¡ Circle Products Used

### 1. USDC â€” Primary Settlement Rail
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

### 3. Circle Agent Wallet â€” Programmable Settlement
A dedicated, funded wallet that the Prediction Market Agent uses to **autonomously settle payouts on-chain**. The private key lives only in server-side environment variables; settlement is executed by `viem`'s `privateKeyToAccount` + `sendTransaction`. This is the foundation of our Agentic Economy submission.

---

## â¬¡ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router, Turbopack) | 16.2.4 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4 |
| **Monorepo** | pnpm workspaces + Turborepo | pnpm 10.33.2 / turbo 2.9.6 |
| **Web3 core** | wagmi + viem | 3.6.5 / 2.47 |
| **Payments** | @circle-fin/app-kit + adapter-viem-v2 | latest |
| **Wallet** | MetaMask (injected connector) | â€” |
| **Server state** | Upstash Redis (via Vercel KV) | â€” |
| **Client state** | Zustand (persist middleware) | â€” |
| **Auth** | X (Twitter) OAuth 2.0 PKCE | â€” |
| **AI** | Google Gemini 2.5 Flash | â€” |
| **PDF / CSV / QR** | jspdf, papaparse, qrcode.react, @yudiel/react-qr-scanner | â€” |
| **Icons** | lucide-react | â€” |
| **Font** | Space Grotesk | â€” |
| **Deploy** | Vercel | â€” |

---

## â¬¡ Arc Network Details

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
| **Fees** | Sub-cent (â‰ˆ 0.001 USDC per tx) |
| **Faucet** | `faucet.circle.com` |

> **Key discovery:** On Arc Testnet, USDC is a *native* token (used via the `value` field), not a standard ERC-20. Transfers use `parseUnits(amount, 18)`. Circle AppKit functions only on deployed environments (Vercel) â€” local development uses a mock transfer path, then real transfers are verified post-deploy.

---

## â¬¡ Repository Structure

```
arc-ecosystem/
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ arc-landing/     # Hub: games, market, events, prediction, AI, voice tour
â”‚   â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”‚   â”œâ”€â”€ game/<name>/page.tsx     # 10+ browser games
â”‚   â”‚   â”‚   â”œâ”€â”€ predict/page.tsx         # Prediction Market UI
â”‚   â”‚   â”‚   â”œâ”€â”€ market/                  # Arc Market
â”‚   â”‚   â”‚   â”œâ”€â”€ events/                  # Arc Events
â”‚   â”‚   â”‚   â”œâ”€â”€ api/predict/             # create Â· bet Â· settle Â· active
â”‚   â”‚   â”‚   â”œâ”€â”€ api/assistant/           # Gemini AI
â”‚   â”‚   â”‚   â””â”€â”€ api/auth/                # X OAuth
â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”‚   â”œâ”€â”€ ChallengeModal.tsx       # USDC wager system
â”‚   â”‚   â”‚   â”œâ”€â”€ ChallengeBar.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ SiteFooter.tsx
â”‚   â”‚   â”‚   â””â”€â”€ VoiceTour.tsx
â”‚   â”‚   â””â”€â”€ lib/
â”‚   â”‚       â”œâ”€â”€ usdcTransfer.ts          # Circle AppKit send pattern
â”‚   â”‚       â”œâ”€â”€ predictionStore.ts       # Redis market/bet state
â”‚   â”‚       â”œâ”€â”€ challengeStore.ts        # Zustand challenge state
â”‚   â”‚       â””â”€â”€ marketStore.ts
â”‚   â”œâ”€â”€ arc-pay/         # QR Â· Split Â· Invoice Â· Payroll Â· Escrow
â”‚   â”œâ”€â”€ arc-creator/     # Tip Â· Subscription Â· Bounty Â· Marketplace
â”‚   â””â”€â”€ arc-play/        # Prediction Â· Raffle Â· Portfolio Â· Launchpad
â”œâ”€â”€ package.json         # packageManager: pnpm@10.33.2
â”œâ”€â”€ pnpm-workspace.yaml
â”œâ”€â”€ turbo.json
â””â”€â”€ .npmrc               # fetch-timeout=300000
```

---

## â¬¡ Getting Started

### Prerequisites
- Node.js 20+
- pnpm 10+
- MetaMask browser extension
- Arc Testnet USDC â€” get it from [faucet.circle.com](https://faucet.circle.com)

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

## â¬¡ Deployment

All four apps deploy independently from the same monorepo on Vercel (root directory set per project):

| App | Root Directory | Live URL |
|-----|---------------|----------|
| Arc Landing | `apps/arc-landing` | [arc-ecosystem-taupe.vercel.app](https://arcecosystemmain.vercel.app/chat) |
| Arc Pay | `apps/arc-pay` | [arc-ecosystem-pay.vercel.app](https://arcecosystemmain.vercel.app/chat) |
| Arc Creator | `apps/arc-creator` | [arc-creator.vercel.app](https://arcecosystemmain.vercel.app) |
| Arc Play | `apps/arc-play` | [arc-play-6j19a7q4q-gogosns-projects.vercel.app](https://arcecosystemmain.vercel.app/predict) |

---

## â¬¡ Feature Matrix

| | Arc Pay | Arc Creator | Arc Play | Arc Landing |
|--|:--:|:--:|:--:|:--:|
| Real USDC transfers | âœ… | âœ… | âœ… | âœ… |
| Circle AppKit | âœ… | âœ… | âœ… | âœ… |
| Agent auto-settlement | â€” | â€” | âœ… | âœ… |
| QR / Invoice / PDF | âœ… | â€” | â€” | â€” |
| Batch payroll (CSV) | âœ… | â€” | â€” | â€” |
| Escrow | âœ… | âœ… | â€” | â€” |
| Tips / Subscriptions | â€” | âœ… | â€” | â€” |
| Prediction market | â€” | â€” | âœ… | âœ… |
| Browser games | â€” | â€” | âœ… | âœ… |
| USDC challenge wagers | â€” | â€” | â€” | âœ… |
| AI assistant | âœ… | âœ… | âœ… | âœ… |
| X OAuth | â€” | â€” | â€” | âœ… |
| EN/TR i18n | â€” | â€” | â€” | âœ… |

**Total: 25+ shipped features across the ecosystem.**

---

## â¬¡ Roadmap

### âœ… Phase 0 â€” MVP (shipped)
- Three consumer apps + hub, all live on Vercel
- Real USDC settlement via Circle AppKit, verified on ArcScan
- Autonomous Prediction Market Agent with on-chain auto-settlement
- 10+ games, challenge system, market, events, AI assistant, voice tour

### â— Phase 1 â€” Smart Contracts (next)
- Move escrow, prediction, and raffle logic from trust-based to **on-chain smart contracts**
- ERC-8004 agent identity & reputation registries (`IdentityRegistry`, `ReputationRegistry`, `ValidationRegistry`)
- Cross-user challenge system backed by Redis (currently per-browser localStorage)

### â—‹ Phase 2 â€” Expansion
- CCTP / Bridge Kit for cross-chain USDC inflow
- Circle Gateway for treasury routing & multi-party settlement
- Nanopayments for high-frequency game micro-wagers
- Native mobile apps (iOS + Android)

### â—‹ Phase 3 â€” Maturity
- Arc Mainnet migration
- Arc SDK v1 (`arc-kit`) published to npm â€” "embed Arc Pay in 3 lines"
- Arc DAO governance, Cross-chain Bridge, Lending, Identity layer

---

## â¬¡ Circle Product Feedback

### Why we chose these products
We chose **Circle AppKit + USDC** because Arc Network is purpose-built for stablecoin commerce. USDC as the native gas token eliminates the dual-token UX problem entirely â€” users need exactly one asset for everything. Circle AppKit gives us a clean, typed `kit.send()` primitive that abstracts away the RPC instability we hit early on with raw `eth_sendTransaction`. The **Agent Wallet** was the natural fit for our Agentic Economy track: a sovereign, programmatic signer that settles payouts without a human in the loop.

### What worked well
- **USDC as native gas** â€” the single biggest UX win. No "go buy ETH to pay gas" step. Tips, micro-wagers, and subscriptions all become economically viable.
- **`kit.send()` reliability** â€” once deployed, the pattern is rock-solid and type-safe. It solved the RPC transaction failures that blocked us when using MetaMask's raw RPC directly.
- **Sub-cent fees** â€” a real bet cost **0.0011 USDC** in network fees. This makes an entire class of micro-economy features possible.
- **Sub-second finality** â€” payments feel instant. There's no "pending" anxiety; the confirmation is effectively immediate.

### What could be improved
- **AppKit localhost limitation** â€” AppKit only functions on deployed environments (Vercel), not localhost. This forced us to maintain a mock transfer path for local dev and only verify real transfers after each deploy, which significantly slowed our iteration loop.
- **Documentation gaps on Arc specifics** â€” we discovered through trial and error that Arc Testnet's USDC is a *native* token with **18 decimals** (not the standard 6, not a standard ERC-20). This cost real debugging time. Initially we also wasted effort on Reown AppKit (@reown/appkit) before learning Circle's KIT_KEY format is incompatible with WalletConnect.
- **RPC stability** â€” the public RPC (`rpc.testnet.arc.network`) was reliable for reads but flaky for raw transaction submission early on; AppKit masked this, but the underlying instability tripped up MetaMask network setup (a stale `rpc.drpc` endpoint returned a mismatched chain ID).
- **Agent Wallet onboarding** â€” setting up a funded programmable wallet for autonomous settlement could be far more streamlined for hackathon timelines.

### Recommendations
- Ship a **local AppKit dev mode** that simulates transactions without requiring a deploy.
- Publish an **Arc Testnet quick-start** that explicitly states USDC is native + 18 decimals, with copy-paste MetaMask config and a verified RPC endpoint.
- Add a **one-click testnet faucet** inside AppKit.
- Provide an **Agent Wallet template** repo for autonomous-settlement use cases.

---

## â¬¡ The Story

Arc Ecosystem was built by **one self-taught builder with zero prior coding experience**, across multiple intense sessions, in a strict mentor-apprentice workflow: every line of code generated and pasted, every command run by hand in PowerShell, every deploy a `git push`.

It began as a single USDC invoice dapp (`arc-invoice-dapp`). That became **Arc Global Payouts** (`arc-payouts.vercel.app`) â€” a payout SaaS with batch CSV, NFT receipts via IPFS, and the first real on-chain USDC transfer. That foundation grew into this monorepo: **four apps, 25+ features, an autonomous settlement agent, and a complete design system** â€” all on native USDC.

The lesson that runs through all of it: **the hard part wasn't the code, it was the discoveries** â€” that Arc's USDC is native and 18 decimals, that Circle AppKit only works deployed, that the agent wallet must be sovereign from the admin. Each one cost hours. Each one is now documented above so the next builder doesn't have to bleed for it.

---

## â¬¡ Built By

**GoGo** â€” self-taught Web3 builder

- ğ• â€” [@0xGoGochain](https://x.com/0xGoGochain)
- GitHub â€” [GoGoSns](https://github.com/GoGoSns)

<div align="center">

---

**â¬¡ Arc Ecosystem** Â· Built on Arc Testnet Â· USDC native Â· One economy, three apps

*Testnet environment â€” tokens have no real value.*

</div>
