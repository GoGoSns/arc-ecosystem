export type GlossaryCategory = 'blockchain' | 'defi' | 'security' | 'wallet' | 'infrastructure' | 'governance';

export interface GlossaryTerm {
  id: string;
  slug: string;
  term: string;
  shortDefinition: string;
  fullDefinition: string;
  category: GlossaryCategory;
  related: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: number;
}

const DAY = 24 * 60 * 60 * 1000;
const BASE_CREATED_AT = Date.UTC(2025, 0, 1);

const RAW_GLOSSARY_TERMS: Array<Omit<GlossaryTerm, 'id' | 'createdAt'>> = [
  {
    slug: 'account-abstraction',
    term: 'Account Abstraction',
    shortDefinition: 'A wallet model that moves policy, permissions, and recovery logic into smart-contract code.',
    fullDefinition:
      'Account abstraction lets wallets behave like programmable accounts instead of fixed key pairs. In Arc-land, it makes payment approvals, recovery flows, and spending rules easier to tailor for users, creators, and teams.',
    category: 'wallet',
    related: ['smart-contract-wallet', 'wallet-connect', 'delegated-spending'],
    difficulty: 'intermediate',
  },
  {
    slug: 'arc-network',
    term: 'Arc Network',
    shortDefinition: 'The chain behind the ecosystem, optimized for fast USDC-native transfers.',
    fullDefinition:
      'Arc Network is the shared execution layer used across the ecosystem. It is the place where Arc Pay, the learning flows, and the future shared modules settle their activity with stablecoin-first rails and low-latency confirmations.',
    category: 'infrastructure',
    related: ['chain-id', 'testnet', 'usdc-native-gas'],
    difficulty: 'beginner',
  },
  {
    slug: 'attestation',
    term: 'Attestation',
    shortDefinition: 'A signed statement that proves a condition, identity, or event happened.',
    fullDefinition:
      'Attestations are useful when a wallet, app, or operator needs to prove something without exposing the raw underlying data. In Arc workflows they can support access controls, trust signals, and governance checks.',
    category: 'governance',
    related: ['dao', 'governance-proposal', 'quorum'],
    difficulty: 'intermediate',
  },
  {
    slug: 'block-explorer',
    term: 'Block Explorer',
    shortDefinition: 'A read-only interface for inspecting transactions, blocks, and addresses.',
    fullDefinition:
      'A block explorer is the public window into chain activity. For Arc users it is where transaction hashes, account balances, and confirmation status can be inspected after a payment or wallet interaction.',
    category: 'infrastructure',
    related: ['transaction-hash', 'indexer', 'hash'],
    difficulty: 'beginner',
  },
  {
    slug: 'bridge',
    term: 'Bridge',
    shortDefinition: 'A transfer path that moves assets or signals between chains or systems.',
    fullDefinition:
      'A bridge connects isolated networks and lets assets or messages move across them. In a stablecoin-first stack it is often part of the path from fiat or another chain into Arc settlement flows.',
    category: 'infrastructure',
    related: ['on-ramp', 'settlement', 'validator'],
    difficulty: 'intermediate',
  },
  {
    slug: 'bundle',
    term: 'Bundle',
    shortDefinition: 'A grouped operation that packages several actions into one execution.',
    fullDefinition:
      'Bundles are useful when a product wants to reduce friction by sending several steps together. For Arc use cases that can mean a payment, metadata update, and access grant all traveling in one user-facing action.',
    category: 'infrastructure',
    related: ['gas-sponsorship', 'intent', 'payment-rail'],
    difficulty: 'intermediate',
  },
  {
    slug: 'chain-id',
    term: 'Chain ID',
    shortDefinition: 'The numeric identifier that tells software which network it is talking to.',
    fullDefinition:
      'Chain IDs prevent wallets and apps from mixing up networks. On Arc, the chain ID becomes a quick sanity check for every signing and routing flow, especially when you are switching between test and production environments.',
    category: 'blockchain',
    related: ['arc-network', 'testnet', 'validator'],
    difficulty: 'beginner',
  },
  {
    slug: 'circle-appkit',
    term: 'Circle AppKit',
    shortDefinition: 'The integration toolkit used to build stablecoin payments and wallet flows.',
    fullDefinition:
      'Circle AppKit is the integration layer that turns wallet, payment, and transfer primitives into product features. In the Arc ecosystem it supports the kind of stablecoin-native interactions that Arc Pay and related modules rely on.',
    category: 'infrastructure',
    related: ['payment-rail', 'settlement', 'usdc-native-gas'],
    difficulty: 'intermediate',
  },
  {
    slug: 'cold-wallet',
    term: 'Cold Wallet',
    shortDefinition: 'A wallet kept offline or minimized for long-term custody and reduced risk.',
    fullDefinition:
      'Cold wallets are favored when security matters more than convenience. They reduce exposure to phishing and browser threats, which makes them useful for treasury, vault, and governance assets in the Arc ecosystem.',
    category: 'security',
    related: ['hot-wallet', 'recovery-phrase', 'vault'],
    difficulty: 'beginner',
  },
  {
    slug: 'dao',
    term: 'DAO',
    shortDefinition: 'A decentralized organization where members coordinate through on-chain rules.',
    fullDefinition:
      'A DAO replaces a traditional management hierarchy with shared rules, votes, and execution logic. In web3 products it is often the mechanism used to steer funding, proposals, and community ownership.',
    category: 'governance',
    related: ['governance-proposal', 'quorum', 'attestation'],
    difficulty: 'beginner',
  },
  {
    slug: 'decimals',
    term: 'Decimals',
    shortDefinition: 'The token precision that determines how small a unit can be divided.',
    fullDefinition:
      'Decimals define how a token amount is represented at the smallest level. Stablecoin UX depends on this detail because payment amounts, balances, and fee calculations need predictable precision.',
    category: 'blockchain',
    related: ['erc-20', 'usdc-native-gas', 'payment-rail'],
    difficulty: 'beginner',
  },
  {
    slug: 'delegated-spending',
    term: 'Delegated Spending',
    shortDefinition: 'A permission model where one wallet grants another limited spending authority.',
    fullDefinition:
      'Delegated spending makes it possible for an app or another wallet to act within controlled limits instead of requiring every action to be signed manually. It is useful for subscriptions, team accounts, and recurring Arc payments.',
    category: 'wallet',
    related: ['account-abstraction', 'permit', 'smart-contract-wallet'],
    difficulty: 'intermediate',
  },
  {
    slug: 'erc-20',
    term: 'ERC-20',
    shortDefinition: 'The standard interface for fungible tokens on EVM-compatible networks.',
    fullDefinition:
      'ERC-20 is the token standard that makes fungible assets interoperable across wallets, exchanges, and apps. It matters to Arc users because stablecoin balances and transfer logic still need a predictable token interface.',
    category: 'blockchain',
    related: ['decimals', 'permit', 'usdc-native-gas'],
    difficulty: 'beginner',
  },
  {
    slug: 'escrow',
    term: 'Escrow',
    shortDefinition: 'Funds held by a neutral flow until conditions for release are met.',
    fullDefinition:
      'Escrow is a trust-reduction pattern used to hold value until both sides of a transaction are satisfied. In Arc workflows it is a clean fit for marketplace payments, creator deals, and coordinated transfers.',
    category: 'defi',
    related: ['settlement', 'payment-rail', 'bridge'],
    difficulty: 'beginner',
  },
  {
    slug: 'epoch',
    term: 'Epoch',
    shortDefinition: 'A chain time window used for scheduling, rewards, or governance checkpoints.',
    fullDefinition:
      'An epoch is a higher-level time bucket used to organize chain events. It can be used to batch governance, finalize reporting, or structure validator operations across the Arc network.',
    category: 'blockchain',
    related: ['finality', 'quorum', 'validator'],
    difficulty: 'intermediate',
  },
  {
    slug: 'finality',
    term: 'Finality',
    shortDefinition: 'The point where a transaction is considered irreversible in practice.',
    fullDefinition:
      'Finality tells you when a transaction is sufficiently settled that the network is unlikely to reorganize it away. Stablecoin products lean on fast finality because users expect payment confirmations to behave like completed cash movements.',
    category: 'blockchain',
    related: ['reorg', 'validator', 'arc-network'],
    difficulty: 'beginner',
  },
  {
    slug: 'fiat-on-ramp',
    term: 'Fiat On-Ramp',
    shortDefinition: 'A path that converts bank money into on-chain assets or stablecoins.',
    fullDefinition:
      'Fiat on-ramps are the bridge between the traditional payment system and a stablecoin application. They are the first step for users who want to enter the Arc ecosystem without already holding crypto.',
    category: 'infrastructure',
    related: ['on-ramp', 'payment-rail', 'bridge'],
    difficulty: 'beginner',
  },
  {
    slug: 'gas-sponsorship',
    term: 'Gas Sponsorship',
    shortDefinition: 'When an app pays network fees on behalf of a user.',
    fullDefinition:
      'Gas sponsorship removes a major onboarding headache by letting the product cover fees. In an Arc-style stablecoin flow that can make a user experience feel closer to a normal app checkout than a blockchain transaction.',
    category: 'wallet',
    related: ['account-abstraction', 'intent', 'bundle'],
    difficulty: 'intermediate',
  },
  {
    slug: 'governance-proposal',
    term: 'Governance Proposal',
    shortDefinition: 'A formal request for the community to vote on a change.',
    fullDefinition:
      'Governance proposals turn discussion into an executable decision process. They are how a DAO can change parameters, allocate funds, or update shared rules without a central operator.',
    category: 'governance',
    related: ['dao', 'quorum', 'epoch'],
    difficulty: 'beginner',
  },
  {
    slug: 'hash',
    term: 'Hash',
    shortDefinition: 'A fixed-length fingerprint for data, transactions, or messages.',
    fullDefinition:
      'Hashes are everywhere in blockchain systems because they give data a compact identifier and protect integrity. For Arc users the hash is often the fastest way to reference a transaction or prove that something on-chain happened.',
    category: 'blockchain',
    related: ['transaction-hash', 'merkle-proof', 'block-explorer'],
    difficulty: 'beginner',
  },
  {
    slug: 'hot-wallet',
    term: 'Hot Wallet',
    shortDefinition: 'A wallet that stays connected for frequent signing and spending.',
    fullDefinition:
      'Hot wallets favor convenience and speed over maximum isolation. They are practical for everyday Arc actions like sending payments, testing flows, or interacting with the ecosystem frequently.',
    category: 'security',
    related: ['cold-wallet', 'wallet-connect', 'vault'],
    difficulty: 'beginner',
  },
  {
    slug: 'indexer',
    term: 'Indexer',
    shortDefinition: 'A service that reads chain data and reshapes it for fast search or UI queries.',
    fullDefinition:
      'Indexers convert raw chain events into application-friendly data. They are what make dashboards, wallets, and search experiences fast enough to feel like product surfaces instead of block scans.',
    category: 'infrastructure',
    related: ['block-explorer', 'transaction-hash', 'watchlist'],
    difficulty: 'intermediate',
  },
  {
    slug: 'intent',
    term: 'Intent',
    shortDefinition: 'A user goal expressed at a higher level than raw transaction steps.',
    fullDefinition:
      'An intent describes what the user wants rather than the exact on-chain instructions. It lets products like payment or routing systems pick the most efficient execution path while keeping the interface simple.',
    category: 'wallet',
    related: ['bundle', 'gas-sponsorship', 'payment-rail'],
    difficulty: 'intermediate',
  },
  {
    slug: 'jit-liquidity',
    term: 'JIT Liquidity',
    shortDefinition: 'Liquidity that appears only when needed for a specific swap or route.',
    fullDefinition:
      'Just-in-time liquidity is a capital-efficient way to serve a trade only when it matters. It can improve quote quality and reduce wasted capital inside routed stablecoin or token flows.',
    category: 'defi',
    related: ['liquidity-pool', 'quote', 'yield-routing'],
    difficulty: 'advanced',
  },
  {
    slug: 'key-rotation',
    term: 'Key Rotation',
    shortDefinition: 'The process of replacing wallet keys without losing control of the account.',
    fullDefinition:
      'Key rotation is one of the cleanest ways to reduce long-term security exposure. It helps teams and power users retire old credentials while keeping the account or vault operational.',
    category: 'security',
    related: ['multisig', 'recovery-phrase', 'vault'],
    difficulty: 'advanced',
  },
  {
    slug: 'ledger',
    term: 'Ledger',
    shortDefinition: 'A record of balances and movements used to reconcile account activity.',
    fullDefinition:
      'A ledger is the accounting backbone of a wallet or payment system. It tracks what happened, when it happened, and how balances should be reconciled across the app and the chain.',
    category: 'wallet',
    related: ['payment-rail', 'wallet-connect', 'vault'],
    difficulty: 'beginner',
  },
  {
    slug: 'liquidity-pool',
    term: 'Liquidity Pool',
    shortDefinition: 'Capital pooled together to support swaps, routing, or market making.',
    fullDefinition:
      'Liquidity pools are the engine behind many DeFi routes. They make it possible to quote and settle swaps at scale, and they often feed the pricing and routing logic that stablecoin products depend on.',
    category: 'defi',
    related: ['yield-routing', 'quote', 'oracle'],
    difficulty: 'intermediate',
  },
  {
    slug: 'merkle-proof',
    term: 'Merkle Proof',
    shortDefinition: 'A compact proof that a piece of data belongs to a larger tree.',
    fullDefinition:
      'Merkle proofs are used to prove inclusion without sharing the whole dataset. In practice they help block explorers, audit tools, and verification flows confirm that a value belongs to a larger on-chain structure.',
    category: 'blockchain',
    related: ['hash', 'block-explorer', 'indexer'],
    difficulty: 'advanced',
  },
  {
    slug: 'multisig',
    term: 'Multisig',
    shortDefinition: 'A wallet or account that requires multiple approvals before execution.',
    fullDefinition:
      'Multisig systems reduce single-point-of-failure risk by requiring several signers. They are a good fit for treasury management, protocol control, and shared operational vaults in the Arc ecosystem.',
    category: 'security',
    related: ['key-rotation', 'cold-wallet', 'vault'],
    difficulty: 'intermediate',
  },
  {
    slug: 'native-gas',
    term: 'Native Gas',
    shortDefinition: 'A network design where the fee token is built into the primary value flow.',
    fullDefinition:
      'Native gas means the network fee model is tied to the chain itself rather than an external token wrapper. That simplifies mental overhead and makes fee handling feel more like a direct product charge.',
    category: 'blockchain',
    related: ['usdc-native-gas', 'chain-id', 'arc-network'],
    difficulty: 'intermediate',
  },
  {
    slug: 'nonce',
    term: 'Nonce',
    shortDefinition: 'A sequence value that keeps transactions ordered and unique.',
    fullDefinition:
      'The nonce is the per-account counter that keeps on-chain actions in order. It prevents replay and ensures a wallet can safely manage multiple pending actions without ambiguity.',
    category: 'blockchain',
    related: ['transaction-hash', 'smart-contract-wallet', 'payment-rail'],
    difficulty: 'beginner',
  },
  {
    slug: 'on-ramp',
    term: 'On-Ramp',
    shortDefinition: 'Any route that brings a user from fiat or another system into crypto.',
    fullDefinition:
      'On-ramps smooth the transition from normal money into a blockchain product. They are a key part of onboarding because most users experience them before they ever understand the chain underneath.',
    category: 'infrastructure',
    related: ['fiat-on-ramp', 'payment-rail', 'settlement'],
    difficulty: 'beginner',
  },
  {
    slug: 'oracle',
    term: 'Oracle',
    shortDefinition: 'A trusted data feed that brings off-chain information on-chain.',
    fullDefinition:
      'Oracles deliver external facts to smart contracts and product logic. Price feeds, timing data, and route conditions often depend on them to keep decisions aligned with the outside world.',
    category: 'defi',
    related: ['liquidity-pool', 'quote', 'yield-routing'],
    difficulty: 'intermediate',
  },
  {
    slug: 'payment-rail',
    term: 'Payment Rail',
    shortDefinition: 'The underlying route that moves money between payer and payee.',
    fullDefinition:
      'A payment rail is the infrastructure that actually moves value. In Arc, the rail is designed around stablecoins so products can feel more like payments software than speculative crypto tooling.',
    category: 'infrastructure',
    related: ['circle-appkit', 'settlement', 'permit'],
    difficulty: 'beginner',
  },
  {
    slug: 'permit',
    term: 'Permit',
    shortDefinition: 'A token approval flow that can be signed once and reused in another action.',
    fullDefinition:
      'Permits allow a wallet to authorize spending without a long approval ceremony. They are useful when you want to combine a permission step and an action into one smoother product interaction.',
    category: 'wallet',
    related: ['erc-20', 'delegated-spending', 'payment-rail'],
    difficulty: 'intermediate',
  },
  {
    slug: 'quorum',
    term: 'Quorum',
    shortDefinition: 'The minimum participation needed for a vote or decision to count.',
    fullDefinition:
      'Quorum is what keeps a governance decision from being made by too few people. It is the threshold that gives a proposal legitimacy, whether the decision is about treasury, product direction, or protocol settings.',
    category: 'governance',
    related: ['dao', 'governance-proposal', 'epoch'],
    difficulty: 'beginner',
  },
  {
    slug: 'quote',
    term: 'Quote',
    shortDefinition: 'A price or route estimate returned before a swap or payment is executed.',
    fullDefinition:
      'A quote gives a user an expected amount, fee, or route before execution. In stablecoin products it is one of the main user-facing signals that helps turn a technical transaction into a transparent choice.',
    category: 'defi',
    related: ['oracle', 'liquidity-pool', 'jit-liquidity'],
    difficulty: 'beginner',
  },
  {
    slug: 'recovery-phrase',
    term: 'Recovery Phrase',
    shortDefinition: 'The secret phrase that can restore access to a wallet.',
    fullDefinition:
      'A recovery phrase is the backup key to a wallet and should be protected like a master password. It is the thing that makes self-custody resilient, but it also means the user carries direct responsibility.',
    category: 'security',
    related: ['cold-wallet', 'hot-wallet', 'vault'],
    difficulty: 'beginner',
  },
  {
    slug: 'reorg',
    term: 'Reorg',
    shortDefinition: 'A chain reorganization where a previously seen block path is replaced.',
    fullDefinition:
      'Reorganizations can briefly rewrite recent chain history when a competing branch becomes canonical. Fast finality and stable validator behavior reduce the impact, but apps still need to handle the edge case.',
    category: 'blockchain',
    related: ['finality', 'hash', 'validator'],
    difficulty: 'advanced',
  },
  {
    slug: 'settlement',
    term: 'Settlement',
    shortDefinition: 'The point where payment or trade obligations are finalized.',
    fullDefinition:
      'Settlement is the handoff from pending intent to final economic truth. Stablecoin apps are judged by how clear and fast this stage feels, because it is the moment users trust value has actually moved.',
    category: 'defi',
    related: ['escrow', 'payment-rail', 'bridge'],
    difficulty: 'beginner',
  },
  {
    slug: 'smart-contract-wallet',
    term: 'Smart Contract Wallet',
    shortDefinition: 'A wallet whose rules live in contract code instead of only in a private key.',
    fullDefinition:
      'Smart contract wallets are the programmable version of custody. They unlock policy logic, spending caps, recovery, and batching patterns that fit the Arc ecosystem very well.',
    category: 'wallet',
    related: ['account-abstraction', 'delegated-spending', 'gas-sponsorship'],
    difficulty: 'intermediate',
  },
  {
    slug: 'testnet',
    term: 'Testnet',
    shortDefinition: 'A non-production network used for testing, learning, and demos.',
    fullDefinition:
      'A testnet is where you try flows before real value is at risk. It is the environment where Arc users can learn the mechanics, send trial transactions, and validate integrations safely.',
    category: 'blockchain',
    related: ['arc-network', 'chain-id', 'block-explorer'],
    difficulty: 'beginner',
  },
  {
    slug: 'transaction-hash',
    term: 'Transaction Hash',
    shortDefinition: 'A unique identifier for a specific on-chain transaction.',
    fullDefinition:
      'Transaction hashes are the canonical receipt for chain activity. They let support teams, users, and explorers point to the exact payment or action that happened on the network.',
    category: 'blockchain',
    related: ['hash', 'block-explorer', 'indexer'],
    difficulty: 'beginner',
  },
  {
    slug: 'universal-wallet',
    term: 'Universal Wallet',
    shortDefinition: 'A wallet layer designed to work across many apps and chains.',
    fullDefinition:
      'A universal wallet reduces the friction of carrying multiple account formats. It gives the user one recognizable entry point while the network-specific details are handled underneath.',
    category: 'wallet',
    related: ['account-abstraction', 'wallet-connect', 'smart-contract-wallet'],
    difficulty: 'intermediate',
  },
  {
    slug: 'usdc-native-gas',
    term: 'USDC Native Gas',
    shortDefinition: 'A network model where USDC is the native fee and settlement asset.',
    fullDefinition:
      'USDC native gas keeps the fee model aligned with the currency users already understand. It makes the Arc experience feel less like juggling several tokens and more like using a stable, predictable payment layer.',
    category: 'infrastructure',
    related: ['native-gas', 'arc-network', 'payment-rail'],
    difficulty: 'beginner',
  },
  {
    slug: 'validator',
    term: 'Validator',
    shortDefinition: 'A node operator responsible for proposing, checking, or finalizing chain state.',
    fullDefinition:
      'Validators are the actors that help a chain remain secure and ordered. Their behavior affects finality, reorg risk, and the confidence apps can place in recent transactions.',
    category: 'blockchain',
    related: ['finality', 'chain-id', 'quorum'],
    difficulty: 'intermediate',
  },
  {
    slug: 'vault',
    term: 'Vault',
    shortDefinition: 'A protected place for long-term assets, permissions, or sensitive records.',
    fullDefinition:
      'A vault is where value or secrets live when they should not be handled casually. In product terms it is a pattern for tighter access, safer operations, and clearer boundaries around critical assets.',
    category: 'security',
    related: ['cold-wallet', 'multisig', 'recovery-phrase'],
    difficulty: 'beginner',
  },
  {
    slug: 'wallet-connect',
    term: 'Wallet Connect',
    shortDefinition: 'The handshake that links a wallet to an app session.',
    fullDefinition:
      'Wallet connectivity is the moment a user proves control over an account and lets the app request actions. It is the foundational UX layer for almost every Arc page that needs a signed interaction.',
    category: 'wallet',
    related: ['universal-wallet', 'hot-wallet', 'account-abstraction'],
    difficulty: 'beginner',
  },
  {
    slug: 'watchlist',
    term: 'Watchlist',
    shortDefinition: 'A curated set of addresses, events, or signals that a user wants to track.',
    fullDefinition:
      'Watchlists turn raw chain noise into something actionable. They are useful in indexers, dashboards, and alerting tools because they let users focus on the accounts that matter most.',
    category: 'infrastructure',
    related: ['indexer', 'block-explorer', 'transaction-hash'],
    difficulty: 'beginner',
  },
  {
    slug: 'xpub',
    term: 'XPub',
    shortDefinition: 'A public extended key used to derive addresses without revealing private control.',
    fullDefinition:
      'An extended public key allows software to generate many addresses while keeping private material secret. It is a common building block for wallets, payment systems, and reporting tools.',
    category: 'wallet',
    related: ['wallet-connect', 'ledger', 'recovery-phrase'],
    difficulty: 'advanced',
  },
  {
    slug: 'yield-routing',
    term: 'Yield Routing',
    shortDefinition: 'The process of sending capital to the most efficient earning path available.',
    fullDefinition:
      'Yield routing looks for the best place to place capital at a given moment. In DeFi products it often combines pools, quotes, and oracle data to maximize the value a user can extract from their assets.',
    category: 'defi',
    related: ['liquidity-pool', 'oracle', 'quote'],
    difficulty: 'advanced',
  },
  {
    slug: 'zero-knowledge-proof',
    term: 'Zero-Knowledge Proof',
    shortDefinition: 'A proof that verifies truth without exposing the underlying secret.',
    fullDefinition:
      'Zero-knowledge proofs let a system verify a claim while revealing almost nothing else. They are a powerful tool for privacy, attestations, and compact validation in future Arc designs.',
    category: 'security',
    related: ['attestation', 'hash', 'merkle-proof'],
    difficulty: 'advanced',
  },
];

export const GLOSSARY_TERMS: GlossaryTerm[] = RAW_GLOSSARY_TERMS.map((term, index) => ({
  ...term,
  id: term.slug,
  createdAt: BASE_CREATED_AT + index * DAY,
}));

export const GLOSSARY_TERMS_BY_SLUG = new Map(GLOSSARY_TERMS.map((term) => [term.slug, term]));

export const GLOSSARY_LETTERS = Array.from(new Set(GLOSSARY_TERMS.map((term) => term.term[0].toUpperCase())));

export function getGlossaryTermBySlug(slug: string) {
  return GLOSSARY_TERMS_BY_SLUG.get(slug);
}

export function getGlossaryRelatedTerms(term: GlossaryTerm) {
  return term.related
    .map((slug) => GLOSSARY_TERMS_BY_SLUG.get(slug))
    .filter((value): value is GlossaryTerm => Boolean(value));
}
