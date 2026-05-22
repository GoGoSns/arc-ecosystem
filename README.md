# Arc Ecosystem

A complete Web3 ecosystem for stablecoin payments, creator monetization, and on-chain gaming — built on Arc Network with native USDC.

**Live Demo:** [arc-ecosystem.vercel.app](https://arc-ecosystem.vercel.app)

## Architecture
Users (Browser + MetaMask)
|
+---------+---------+
|         |         |
Arc Pay  Arc Creator  Arc Play
|         |         |
+----+----+----+----+
|         |
Circle AppKit  Agent Wallet
|         |
USDC (native, 18 decimals)
|
Arc Testnet (chainId 5042002)
Sub-cent fees | <1s finality

## Track

**Track 1: Best Cross-Border Payments and Remittances Experience**

Arc Pay enables instant, low-cost USDC payments across borders. Users connect a wallet, send USDC to anyone with a link, split bills, generate invoices, batch payroll, and settle escrow — all on Arc Testnet with sub-cent fees.

## Apps

### Arc Pay (Payments)
- QR Payment — scan and pay with USDC
- Split the Bill — divide expenses among friends
- Invoice + PDF — generate and send professional invoices
- Payroll (Batch) — pay multiple recipients in one transaction
- Trust Escrow — milestone-based secure payments

### Arc Creator (Monetization)
- Tip Jar — accept USDC tips from fans
- Subscription — recurring creator payments
- Bounty Board — post and claim bounties
- Marketplace — buy and sell digital goods

### Arc Play (Gaming + DeFi)
- Portfolio Tracker — track token holdings
- Prediction Market — bet on outcomes
- NFT Raffle — create and join raffles
- Token Launchpad — launch tokens
- 10+ Browser Games with USDC challenge system

## Tech Stack

- Framework: Next.js 16.2.4 + TypeScript
- Styling: Tailwind CSS 4
- Monorepo: pnpm + Turborepo
- Blockchain: Arc Testnet (chainId 5042002)
- Payments: Circle AppKit (@circle-fin/app-kit)
- Wallet: MetaMask (injected)
- Agent Wallet: Circle Programmable Wallet
- AI: Google Gemini 2.5 Flash
- Database: Upstash Redis (via Vercel KV)
- Auth: X (Twitter) OAuth 2.0 PKCE
- Deploy: Vercel

## Circle Products Used

### USDC (Primary Settlement Rail)
All payments settle in USDC — the native gas token on Arc Testnet with 18 decimals. Used for gas fees, payments, tips, subscriptions, escrow, and game challenges.

### Circle AppKit (@circle-fin/app-kit)
Core payment SDK using kit.send() for all USDC transfers:

```typescript
const tx = await kit.send({
  from: { adapter, chain: 'Arc_Testnet' as never },
  to: recipientAddress,
  amount: '10.00',
  token: 'USDC',
});
```

### Circle Agent Wallet
Programmable wallet funded with USDC on BASE. Planned for automated payouts and game reward distribution.

## Arc Testnet Details

- Chain ID: 5042002
- RPC: https://rpc.testnet.arc.network
- Explorer: https://testnet.arcscan.app
- Gas Token: USDC (native)
- USDC Decimals: 18
- USDC Contract: 0x3600000000000000000000000000000000000000
- Block Time: less than 1 second
- Fees: Sub-cent

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 10+
- MetaMask browser extension
- Arc Testnet USDC (get from faucet.circle.com)

### Installation
```bash
git clone https://github.com/GoGoSns/arc-ecosystem.git
cd arc-ecosystem
pnpm install
```

### Environment Variables
Create .env.local in each app directory:
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
KV_REST_API_URL=your_upstash_url
KV_REST_API_TOKEN=your_upstash_token
NEXT_PUBLIC_APP_URL=https://arcecosystemmain.vercel.app

### Run Development
```bash
pnpm dev
```

### Build
```bash
pnpm build
```

## Deployment

| App | URL |
|-----|-----|
| Arc Landing | https://arc-ecosystem.vercel.app |
| Arc Pay | https://arc-ecosystem-pay.vercel.app |
| Arc Creator | https://arc-ecosystem-creator.vercel.app |
| Arc Play | https://arc-play-6j19a7q4q-gogosns-projects.vercel.app |

## Circle Product Feedback

### Why we chose these products
Circle AppKit and USDC because Arc Network is purpose-built for stablecoin commerce. USDC as native gas token eliminates the need for a separate gas token, simplifying UX dramatically.

### What worked well
- USDC as native gas: Users only need one token for everything. Massive UX improvement.
- Circle AppKit SDK: kit.send() pattern is intuitive and works reliably on Vercel.
- Sub-cent fees: Real USDC transfers for under $0.01 makes micropayments viable.
- Fast finality: Less than 1 second block times mean payments feel instant.

### What could be improved
- AppKit localhost limitation: Only functions on deployed environments, not localhost. Slows development — had to implement mock transfers for local testing.
- Documentation gaps: Arc Testnet-specific configurations like USDC 18 decimals were discovered through trial and error.
- Agent Wallet onboarding: Setup process could be more streamlined for hackathon participants.

### Recommendations
- Provide local development mode for AppKit that simulates transactions.
- Add Arc Testnet quick-start guides with correct decimal configurations.
- Create one-click faucet integration within AppKit for testnet USDC.

## Built By

GoGo (@0xGoGochain)
- X: https://x.com/0xGoGochain
- GitHub: https://github.com/GoGoSns

## License

MIT
