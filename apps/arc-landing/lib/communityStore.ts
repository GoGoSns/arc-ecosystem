export type CommunityChannel = {
  id: string;
  label: string;
  description: string;
};

export type Community = {
  id: string;
  name: string;
  symbol: string;
  accent: string;
  description: string;
  members: number;
  online: number;
  verified: boolean;
  contract?: string;
  channels: CommunityChannel[];
  riskSignals: { tone: "positive" | "warning" | "danger"; label: string }[];
};

export type CommunityMessage = {
  id: string;
  communityId: string;
  channelId: string;
  author: string;
  address: string;
  role: "builder" | "analyst" | "member" | "moderator";
  body: string;
  createdAt: number;
  reactions: number;
  replyTo?: string;
  tx?: { amount: string; hash: string; url: string };
};

export type LfgPost = {
  id: string;
  communityId: string;
  title: string;
  description: string;
  roles: string[];
  language: "TR" | "EN";
  spots: number;
  author: string;
};

export const COMMUNITIES: Community[] = [
  {
    id: "arc-doge",
    name: "Arc Doge",
    symbol: "DOGE",
    accent: "#ffcc66",
    description: "A community-led meme experiment built and reviewed in public on Arc.",
    members: 842,
    online: 126,
    verified: true,
    contract: "0x7a2f6bA87F7aB8F56CC4d9F420e22D3D57A05E21",
    channels: [
      { id: "general", label: "general", description: "Community updates and open conversation" },
      { id: "token-review", label: "token-review", description: "Evidence-led contract and token analysis" },
      { id: "build-together", label: "build-together", description: "Find contributors and form working groups" },
    ],
    riskSignals: [
      { tone: "positive", label: "Source code verified" },
      { tone: "warning", label: "Top 10 wallets hold 61%" },
      { tone: "danger", label: "Mint authority requires review" },
    ],
  },
  {
    id: "arc-builders-tr",
    name: "Arc Builders TR",
    symbol: "TR",
    accent: "#80e1ff",
    description: "Turkish builders shipping payment, agent and community products on Arc.",
    members: 316,
    online: 58,
    verified: true,
    channels: [
      { id: "general", label: "genel", description: "Arc ekosistemi ve proje sohbeti" },
      { id: "build-together", label: "ekip-bul", description: "Geliştirici, tasarımcı ve topluluk ekipleri" },
      { id: "token-review", label: "inceleme", description: "Projeleri kanıtlarla birlikte değerlendirin" },
    ],
    riskSignals: [{ tone: "positive", label: "Community verified" }],
  },
  {
    id: "agent-economy",
    name: "Agent Economy",
    symbol: "AGENT",
    accent: "#b8ff80",
    description: "Agents, x402 services and autonomous USDC payments on Arc.",
    members: 504,
    online: 73,
    verified: false,
    channels: [
      { id: "general", label: "general", description: "Agent economy discussion" },
      { id: "build-together", label: "collaborate", description: "Find an agent team" },
    ],
    riskSignals: [{ tone: "warning", label: "Community-submitted project" }],
  },
];

export const SEED_MESSAGES: CommunityMessage[] = [
  {
    id: "seed-1", communityId: "arc-doge", channelId: "token-review", author: "mert.arc",
    address: "0x75A1297A7eB20E44F0C6D8eC3c9D1B273fE5A912", role: "analyst",
    body: "Contract source is verified. I am checking owner and mint permissions now; please do not treat this as a buy signal.",
    createdAt: Date.now() - 12 * 60_000, reactions: 14,
  },
  {
    id: "seed-2", communityId: "arc-doge", channelId: "token-review", author: "selin.builds",
    address: "0x3B3D3c5406Aca846A2fE066D5EB67cF8C2F58D31", role: "builder",
    body: "I found an active mint authority. We should ask the deployer for a clear plan before marking the project reviewed.",
    createdAt: Date.now() - 7 * 60_000, reactions: 21, replyTo: "seed-1",
  },
  {
    id: "seed-3", communityId: "arc-builders-tr", channelId: "general", author: "arcdeniz",
    address: "0xB87B774a5b3D77E13a89C68F62810D5a23404365", role: "moderator",
    body: "Hoş geldiniz. Projenizi paylaşırken kontrat adresi, repo ve çalışan demo ekleyin. Fiyat çağrısı yerine kanıt konuşuyoruz.",
    createdAt: Date.now() - 28 * 60_000, reactions: 32,
  },
];

export const LFG_POSTS: LfgPost[] = [
  { id: "lfg-1", communityId: "arc-doge", title: "Token contract review squad", description: "Looking for two Solidity reviewers to document owner controls and holder distribution.", roles: ["Solidity", "Analyst"], language: "EN", spots: 2, author: "mert.arc" },
  { id: "lfg-2", communityId: "arc-builders-tr", title: "Arc sosyal ürün ekibi", description: "Realtime chat ve wallet UX üzerinde çalışacak geliştirici ve tasarımcı arıyoruz.", roles: ["Frontend", "Product"], language: "TR", spots: 3, author: "arcdeniz" },
];

const MESSAGE_KEY = "arc-community:messages:v1";

export function communityTimestamp(): number {
  return Date.now();
}

export function loadCommunityMessages(): CommunityMessage[] {
  if (typeof window === "undefined") return SEED_MESSAGES;
  try {
    const stored = JSON.parse(localStorage.getItem(MESSAGE_KEY) || "[]") as CommunityMessage[];
    return [...SEED_MESSAGES, ...stored];
  } catch {
    return SEED_MESSAGES;
  }
}

export function persistCommunityMessage(message: CommunityMessage): void {
  const existing = loadCommunityMessages().filter((item) => !item.id.startsWith("seed-"));
  localStorage.setItem(MESSAGE_KEY, JSON.stringify([...existing, message].slice(-200)));
}
