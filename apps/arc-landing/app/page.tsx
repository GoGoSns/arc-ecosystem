"use client";

import {
  ArrowRight,
  ChevronRight,
  FileText,
  Github,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppSwitcher from "@/components/AppSwitcher";
import VoiceTour from "@/components/VoiceTour";
import SiteHeader from "@/components/SiteHeader";
import { getArcAppUrl, isExternalUrl } from "@/lib/arcAppLinks";
import { useVoiceTourStore, type VoiceTourSectionId } from "@/lib/voiceTourStore";
import { translations, type Lang } from "@/lib/translations";
import LanguageToggle from "@/components/LanguageToggle";
import DelphiTerminal from "@/components/DelphiTerminal";

type Feature = {
  name: string;
  href: string | null;
  soon?: boolean;
};

type AppCard = {
  voiceId: VoiceTourSectionId;
  label: string;
  title: string;
  description: string;
  url: string | null;
  cta: string;
  features: Feature[];
};

const arcPayUrl = getArcAppUrl('pay') ?? 'https://arcpaymain.vercel.app';
const arcCreatorUrl = getArcAppUrl('creator');
const arcPlayUrl = getArcAppUrl('play');
const docsHref = '/learn';
const githubHref = 'https://github.com/GoGoSns/arc-ecosystem';

const appCards: AppCard[] = [
  {
    label: "// 01 · payments",
    title: "ARC PAY",
    voiceId: 'pay',
    description: "Send USDC instantly. No banks, no delays.",
    url: arcPayUrl,
    cta: "LAUNCH ARC PAY",
    features: [
      { name: "QR Payment", href: getArcAppUrl('pay', '/qr') },
      { name: "Split the Bill", href: getArcAppUrl('pay', '/split') },
      { name: "Invoice + PDF", href: getArcAppUrl('pay', '/invoice') },
      { name: "Payroll (Batch)", href: getArcAppUrl('pay', '/payroll') },
      { name: "Trust Escrow", href: getArcAppUrl('pay', '/escrow') },
    ],
  },
  {
    label: "// 02 · monetization",
    title: "ARC CREATOR",
    voiceId: 'creator',
    description: "Monetize your creativity with USDC.",
    url: arcCreatorUrl,
    cta: "LAUNCH ARC CREATOR",
    features: [
      { name: "Tip Jar", href: getArcAppUrl('creator', '/tip') },
      { name: "Subscription", href: getArcAppUrl('creator', '/subscription') },
      { name: "Bounty Board", href: getArcAppUrl('creator', '/bounty'), soon: false },
      { name: "Marketplace", href: getArcAppUrl('creator', '/marketplace'), soon: false },
    ],
  },
  {
    label: "// 03 · gaming + defi",
    title: "ARC PLAY",
    voiceId: 'play',
    description: "Play, predict, profit on-chain.",
    url: arcPlayUrl,
    cta: "LAUNCH ARC PLAY",
    features: [
      { name: "Portfolio Tracker", href: getArcAppUrl('play', '/portfolio') },
      { name: "Prediction Market", href: getArcAppUrl('play', '/prediction') },
      { name: "NFT Raffle", href: getArcAppUrl('play', '/raffle') },
      { name: "Play to Earn", href: getArcAppUrl('play', '/games'), soon: false },
      { name: "Token Launchpad", href: getArcAppUrl('play', '/launchpad'), soon: false },
    ],
  },
] ;

const voiceTourSections = [
  { id: 'pay', href: arcPayUrl ?? undefined },
  { id: 'creator', href: arcCreatorUrl ?? undefined },
  { id: 'play', href: arcPlayUrl ?? undefined },
  { id: 'gameHub', href: '/game' },
] satisfies { id: VoiceTourSectionId; href?: string }[];

const faqs = [
  [
    "What is Arc Ecosystem?",
    "Arc Ecosystem is a suite of three USDC-native apps (Arc Pay, Arc Creator, Arc Play) built on Arc Network. Each app focuses on a distinct use case while sharing the same wallet, token, and design language.",
  ],
  [
    "What is Arc Network?",
    "Arc Network is a high-throughput blockchain optimized for stablecoin payments and DeFi. USDC is the native gas token, transactions confirm in under a second, and fees are sub-cent.",
  ],
  [
    "Do I need ETH or another token to use this?",
    "No. Arc Network uses USDC as its native gas token. You only need USDC to interact with any app in the ecosystem.",
  ],
  [
    "Is it free to use?",
    "Network fees are paid in USDC and are typically less than $0.01 per transaction. The apps themselves are free to use.",
  ],
  [
    "Where can I get test USDC?",
    "Visit faucet.circle.com and enter your wallet address. Test USDC is delivered instantly on Arc Testnet.",
  ],
  [
    "Are smart contracts deployed?",
    "The current MVP uses trust-based mechanics (escrow, prediction markets, raffles rely on creators acting honestly) with on-chain payment settlement via Circle AppKit. Smart contract escrow is planned for Phase 2.",
  ],
  [
    "Is the project open source?",
    "Yes. All three apps and the planned shared packages are open source under the MIT license. See the GitHub link in Resources.",
  ],
  [
    "How can I contribute?",
    "Open issues or pull requests on the GitHub repository, follow on X for development updates, or contact directly for partnership opportunities.",
  ],
];

const wallets = [
  "0xB87B...4365",
  "0xCf87...c02f",
  "0xD844...9B3d",
  "0x319d...460F",
  "0xD4c0...daae",
  "0x3C33...752D",
];

const sdkSteps = [
  { title: "CONNECT", body: "Wallet context", benefits: ["fast", "typed", "reusable"] },
  { title: "SEND", body: "Payment request", benefits: ["low-fee", "instant", "secure"] },
  { title: "TRACK", body: "Confirmation", benefits: ["on-chain", "indexed", "verified"] },
];

const revealDelay = (delayMs: number) => ({ transitionDelay: `${delayMs}ms` });

function Brackets() {
  return (
    <>
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />
    </>
  );
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.9 2h3.7l-8.1 9.2L24 22h-7.4l-5.8-6.8L4.2 22H.5l8.6-9.9L0 2h7.6l5.2 6.1L18.9 2Zm-1.3 18h2.1L6.5 3.9H4.3L17.6 20Z"
      />
    </svg>
  );
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [lang, setLang] = useState<Lang>('en');
  const [sdkStep, setSdkStep] = useState(0);
  const pathname = usePathname();
  const activeVoiceSectionId = useVoiceTourStore((state) => state.activeSectionId);
  const requestVoiceTour = useVoiceTourStore((state) => state.requestTour);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.16 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('arc-lang') as Lang | null;
    if (saved === 'tr' || saved === 'en') setLang(saved);
    else if (typeof navigator !== 'undefined' && navigator.language?.startsWith('tr')) setLang('tr');
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setMenuOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const timer = window.setInterval(() => {
      setSdkStep((value) => (value + 1) % sdkSteps.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, []);

  const handleLangChange = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('arc-lang', newLang);
  };

  const t = translations[lang];
  const heroWords = t.hero.title.split(' ');
  const heroFirst = heroWords[0];
  const heroRest = heroWords.slice(1).join(' ');
  const desktopNavLinks = [
    { href: '/value', label: t.nav.value },
    { href: '/roadmap', label: t.nav.roadmap },
    { href: '/showcase', label: t.nav.showcase },
    { href: '/jobs', label: t.nav.jobs },
    { href: '/forum', label: t.nav.forum },
    { href: '/node', label: t.nav.node },
    { href: '/learn', label: t.nav.learn },
  ];
  const drawerNavGroups = [
    {
      title: 'Primary routes',
      links: [
        { href: '/value', label: t.nav.value },
        { href: '/roadmap', label: t.nav.roadmap },
        { href: '/showcase', label: t.nav.showcase },
        { href: '/jobs', label: t.nav.jobs },
        { href: '/forum', label: t.nav.forum },
        { href: '/node', label: t.nav.node },
        { href: '/learn', label: t.nav.learn },
      ],
    },
    {
      title: 'Sections',
      links: [
        { href: '#apps', label: t.nav.apps },
        { href: '#architecture', label: t.nav.architecture },
        { href: '#sdk', label: t.nav.sdk },
        { href: '#resources', label: t.nav.docs },
        { href: '#faq', label: t.nav.faq },
      ],
    },
    {
      title: 'More',
      links: [
        { href: '/quests', label: t.nav.quests },
        { href: '/roulette', label: t.nav.roulette },
        { href: '/game', label: t.nav.game },
        { href: '/market', label: t.nav.market },
        { href: '/events', label: t.nav.events },
        { href: '/race', label: t.nav.race },
        { href: '/drops', label: t.nav.drops },
        { href: '/vault', label: t.nav.vault },
        { href: '/signals', label: t.nav.signals },
        { href: '/glossary', label: t.nav.glossary },
        { href: '/stats', label: t.nav.stats },
        { href: '/feedback', label: t.nav.feedback },
      ],
    },
  ];
  const isActiveRoute = (href: string) => href !== '/' && (pathname === href || pathname.startsWith(`${href}/`));
  const cardDesc = [
    { title: t.apps.payTitle, description: t.apps.payDescription },
    { title: t.apps.creatorTitle, description: t.apps.creatorDescription },
    { title: t.apps.playTitle, description: t.apps.playDescription },
  ];
  const appCardLabels = [
    t.home.cards.payLabel,
    t.home.cards.creatorLabel,
    t.home.cards.playLabel,
  ];
  const appCardCtas = [
    t.home.cards.payCta,
    t.home.cards.creatorCta,
    t.home.cards.playCta,
  ];
  return (
    <main className="page-shell min-h-screen overflow-x-clip text-white">
      <SiteHeader currentLang={lang} onLangChange={handleLangChange} />

      <section id="top" className="hero-grid relative overflow-hidden px-4 pt-16">
        <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 py-20 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:py-28">
          <div className="reveal relative z-10 max-w-3xl text-left" style={revealDelay(80)}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#f5d060]">
                Dark + arc gold
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#1a1a2e] bg-white/[0.02] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#bdbdbd]">
                <span className="pulse-dot" />
                Controlled motion
              </span>
            </div>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.35em] text-[#d4af37]">{t.hero.tagline}</p>
            <h1
              className="mt-8 max-w-4xl text-[clamp(3.4rem,8vw,8rem)] font-black uppercase leading-[0.88] tracking-[-0.05em] text-white"
              data-text={t.hero.title}
            >
              <span className="block">{heroFirst}</span>
              <span className="block text-[#d4af37]">{heroRest}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c7c7c7] sm:text-xl">
              {t.hero.subtitle}
            </p>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#8a8a9a] sm:text-lg">
              {t.hero.description}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              {arcPayUrl ? (
                <a
                  href={arcPayUrl}
                  target={isExternalUrl(arcPayUrl) ? "_blank" : undefined}
                  rel={isExternalUrl(arcPayUrl) ? "noopener noreferrer" : undefined}
                  className="primary-button"
                >
                  {t.hero.ctaPrimary} <ArrowRight size={16} />
                </a>
              ) : (
                <a
                  href="https://arcpaymain.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="primary-button"
                >
                  {t.hero.ctaPrimary} <ArrowRight size={16} />
                </a>
              )}
              <a href="#apps" className="secondary-button">{t.hero.ctaSecondary}</a>
              <button
                type="button"
                onClick={() => requestVoiceTour('tour')}
                className="secondary-button"
                aria-label={t.voiceTour.start}
              >
                {t.voiceTour.start}
              </button>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                { label: t.home.cards.payLabel, value: t.apps.payDescription },
                { label: t.home.cards.creatorLabel, value: t.apps.creatorDescription },
                { label: t.home.cards.playLabel, value: t.apps.playDescription },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#8a8a9a]">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal relative z-10" style={revealDelay(180)}>
            <div className="bracket-card relative overflow-hidden p-6 sm:p-8">
              <Brackets />
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#d4af37]">// live system map</p>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#30d158]/20 bg-[#30d158]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#a6f4bf]">
                  <span className="green-dot" />
                  Synced
                </span>
              </div>
              <h2 className="mt-5 text-3xl font-black uppercase leading-tight sm:text-4xl">
                Three apps. One network language.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#8a8a9a]">
                Stablecoin payments, creator monetization, and play systems share the same visual grammar and
                infrastructure story.
              </p>
              <div className="mt-6 space-y-3">
                {appCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4 transition-colors hover:border-[#d4af37]/25"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#8a8a9a]">{card.label}</p>
                        <h3 className="mt-1 text-lg font-black uppercase text-white">{card.title}</h3>
                      </div>
                      
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#8a8a9a]">{card.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#8a8a9a]">Chain</p>
                  <p className="mt-2 text-sm font-semibold text-white">5042002</p>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#8a8a9a]">Gas</p>
                  <p className="mt-2 text-sm font-semibold text-white">USDC native</p>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#8a8a9a]">Latency</p>
                  <p className="mt-2 text-sm font-semibold text-white">&lt; 1s blocks</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#1a1a2e] bg-white/[0.015] px-4 py-5 font-mono text-xs uppercase tracking-[0.22em] text-[#8a8a9a]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <span>[ {t.stats.apps} &middot; 3 ]</span><span className="text-[#1a1a2e]">|</span>
          <span>[ {t.stats.features} &middot; 13 ]</span><span className="text-[#1a1a2e]">|</span>
          <span>[ {t.stats.network} &middot; {t.stats.networkValue} ]</span><span className="text-[#1a1a2e]">|</span>
          <span>[ {t.stats.status} &middot; <span className="pulse-dot" /> {t.stats.live} ]</span>
        </div>
      </section>

      <section className="section">
        <div className="reveal mx-auto max-w-7xl" style={revealDelay(80)}>
          <VoiceTour sections={voiceTourSections} defaultLanguage={lang} />
        </div>
      </section>

      <section id="apps" className="section">
        <div className="reveal mx-auto max-w-7xl" style={revealDelay(140)}>
        <SectionTitle label={`// ${t.sections.pillarsTitle.toLowerCase()}`} title={t.sections.pillarsSubtitle} />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {appCards.map((card, idx) => (
            <article
              key={card.title}
              data-active={activeVoiceSectionId === card.voiceId ? 'true' : undefined}
              className={`reveal pillars-card bracket-card flex min-h-[560px] flex-col p-6 sm:p-8 transition-all duration-300 ${
                activeVoiceSectionId === card.voiceId
                  ? 'ring-1 ring-[#d4af37]/45 shadow-[0_24px_80px_rgba(212, 175, 55,0.12)]'
                  : ''
              }`}
              style={revealDelay(120 + idx * 90)}
            >
              <Brackets />
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#d4af37]">{appCardLabels[idx]}</p>
                <button
                    type="button"
                    onClick={() => requestVoiceTour('section', card.voiceId)}
                    aria-label={`${t.voiceTour.listen} ${card.title}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#f5d060] transition-colors hover:bg-[#d4af37]/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60"
                  >
                    {t.voiceTour.listen}
                  </button>
                </div>
                <h3 className="mt-5 text-4xl font-black tracking-wide">{cardDesc[idx].title.toUpperCase()}</h3>
                <p className="mt-4 min-h-14 text-[#8b8b8b]">{cardDesc[idx].description}</p>
                <div className="mt-8 space-y-3">
                  {card.features.map((feature) => (
                    feature.href ? (
                      <a
                        key={feature.name}
                        href={feature.href}
                        target={isExternalUrl(feature.href) ? "_blank" : undefined}
                        rel={isExternalUrl(feature.href) ? "noopener noreferrer" : undefined}
                        className="feature-link"
                      >
                        <span>{feature.name}</span>
                        <span className="ml-auto flex items-center gap-2">
                          
                          <ChevronRight className="feature-arrow pillars-arrow" size={16} />
                        </span>
                      </a>
                    ) : (
                      <span
                        key={feature.name}
                        aria-disabled="true"
                        className="feature-link transition-colors hover:border-[#d4af37]/30"
                      >
                        <span>{feature.name}</span>
                        <span className="ml-auto flex items-center gap-2">
                          
                          <ChevronRight className="feature-arrow pillars-arrow" size={16} />
                        </span>
                      </span>
                    )
                  ))}
                </div>
                {card.url ? (
                  <a
                    href={card.url}
                    target={isExternalUrl(card.url) ? "_blank" : undefined}
                    rel={isExternalUrl(card.url) ? "noopener noreferrer" : undefined}
                    className="bracket-button mt-auto w-full justify-center"
                  >
                    {appCardCtas[idx]} <ArrowRight size={15} />
                  </a>
                ) : (
                  <span aria-disabled="true" className="bracket-button mt-auto w-full justify-center cursor-not-allowed opacity-50">
                    {appCardCtas[idx]} <ArrowRight size={15} />
                  </span>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="section border-y border-[#1a1a2e] bg-white/[0.01]">
        <div className="reveal mx-auto max-w-7xl">
          <SectionTitle label={`// ${t.sections.architectureTitle.toLowerCase()}`} title="How Arc routes value across apps in real time." />
          <div className="architecture mt-14 grid gap-8 lg:grid-cols-[1fr_1.1fr_1fr]">
            <span className="architecture-flow architecture-flow-left" aria-hidden="true" />
            <span className="architecture-flow architecture-flow-right" aria-hidden="true" />
            <DiagramColumn title="SOURCES" items={["Users", "Creators", "Teams", "Events"]} activeIndex={0} />
            <div className="bracket-card core-box p-8 text-center">
              <Brackets />
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#d4af37]">ARC RAIL</p>
              <h3 className="mt-4 text-4xl font-black">Settlement Engine</h3>
              <div className="mt-8 space-y-3 font-mono text-sm text-[#8a8a9a]">
                <p>Routing Rules: Active</p>
                <p>Reliability: 99.9%</p>
                <p>Avg Conf: &lt;1s</p>
                <p className="text-white">Status: <span className="green-dot" /> SYNCED</p>
              </div>
            </div>
            <DiagramColumn title="DESTINATIONS" items={["Arc Pay", "Arc Creator", "Arc Play", "Market", "Rewards"]} activeIndex={2} />
          </div>
          
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-[#1a1a2e] pt-12 md:grid-cols-4">
            {[
              { step: "Initiate", desc: "User triggers USDC action" },
              { step: "Route", desc: "Arc Rail validates paths" },
              { step: "Confirm", desc: "Instant settlement on-chain" },
              { step: "Record", desc: "Immutable event logging" },
            ].map((item, idx) => (
              <div key={item.step} className="text-center md:text-left">
                <div className="flex items-center justify-center gap-3 md:justify-start">
                  <span className="font-mono text-[10px] text-[#d4af37]">0{idx + 1}</span>
                  <h4 className="font-mono text-xs uppercase tracking-widest text-white">{item.step}</h4>
                  {idx < 3 && <ArrowRight size={12} className="hidden text-[#1a1a2e] md:block" />}
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-[#555566]">{item.desc}</p>
              </div>
            ))}
          </div>

          <p className="mt-16 text-center font-mono text-xs uppercase tracking-[0.24em] text-[#555566]">
            Success Rate &middot; 99.9% <span className="mx-3 text-[#1a1a2e]">|</span> Conf. Time &middot; &lt; 1s <span className="mx-3 text-[#1a1a2e]">|</span>{" "}
            Modules &middot; 13 Active
          </p>
        </div>
      </section>

      <section id="sdk" className="section">
        <div className="reveal mx-auto max-w-7xl">
          <SectionTitle label={`// ${t.sections.sdkTitle.toLowerCase()}`} title={t.sections.sdkSubtitle} />
          <div className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-5">
              {sdkSteps.map((step, index) => (
                <div key={step.title} className="step-row" data-active={sdkStep === index ? 'true' : undefined}>
                  <span className="font-mono text-[10px] text-[#d4af37]">[0{index + 1}]</span>
                  <div className="flex-1">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-white">{step.title}</h3>
                    <p className="mt-1 text-sm font-bold text-[#d4af37]">{step.body}</p>
                    <div className="mt-2 flex gap-3">
                      {step.benefits.map((benefit) => (
                        <span key={benefit} className="font-mono text-[9px] uppercase tracking-tighter text-[#555566]">
                          &middot; {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="ml-auto text-[#1a1a2e]" size={18} />
                </div>
              ))}
              <div className="pt-6">
                <p className="inline-flex border border-[#1a1a2e] px-3 py-1 font-mono text-xs uppercase text-[#555566]">// arc-kit &middot; v0.1.0</p>
                <p className="mt-5 max-w-xl leading-7 text-[#8b8b8b]">
                  A TypeScript-first SDK for building on Arc Network. Submit USDC transactions with sub-cent fees.
                </p>
              </div>
            </div>
            <CodeTerminal activeStep={sdkStep} />
          </div>
        </div>
      </section>

      <section id="resources" className="section border-y border-[#1a1a2e] bg-white/[0.01]">
        <div className="reveal mx-auto max-w-7xl">
          <SectionTitle label={t.sections.resourcesTitle.toLowerCase()} title={t.sections.resourcesSubtitle} />
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            <div className="reveal" style={revealDelay(100)}>
              <ResourceCard
                icon={<FileText size={42} />}
                label={t.home.resources.docsLabel}
                title={t.home.resources.docsTitle}
                text={t.home.resources.docsText}
                footer={t.home.resources.docsFooter}
                href={docsHref}
              />
            </div>
            <div className="reveal" style={revealDelay(180)}>
              <ResourceCard
                icon={<Github size={42} />}
                label={t.home.resources.githubLabel}
                title={t.home.resources.githubTitle}
                text={t.home.resources.githubText}
                footer={t.home.resources.githubFooter}
                href={githubHref}
              />
            </div>
            <div className="reveal" style={revealDelay(260)}>
              <ResourceCard
                icon={<XLogo />}
                label={t.home.resources.communityLabel}
                title={t.home.resources.communityTitle}
                text={t.home.resources.communityText}
                footer="FOLLOW US"
                href="https://x.com/0xGoGochain"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="reveal cta-banner bracket-card mx-auto max-w-7xl px-5 py-20 text-center sm:px-10 lg:py-28">
          <span className="cta-band" aria-hidden="true" />
          <span className="cta-grid" aria-hidden="true" />
          <div className="relative z-10">
            <Brackets />
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-[#d4af37]">// ready</p>
            <h2 className="mx-auto mt-8 max-w-5xl text-4xl font-black uppercase leading-tight sm:text-6xl lg:text-7xl">
              {t.sections.ctaTitle}
            </h2>
            <p className="mx-auto mt-8 max-w-xl leading-7 text-[#8a8a9a]">
              {t.sections.ctaSubtitle}
            </p>
            {arcPayUrl ? (
              <a
                href={arcPayUrl}
                target={isExternalUrl(arcPayUrl) ? "_blank" : undefined}
                rel={isExternalUrl(arcPayUrl) ? "noopener noreferrer" : undefined}
                className="primary-button mt-10"
              >
                {t.home.cta.start}
              </a>
            ) : (
              <a
                href="https://arcpaymain.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="primary-button mt-10"
              >
                {t.home.cta.start}
              </a>            )}
            <p className="mt-14 font-mono text-xs uppercase tracking-[0.35em] text-white/15">// arc &middot; stablecoin &middot; onchain</p>
          </div>
        </div>
      </section>

      <section id="faq" className="section pt-0">
        <div className="reveal mx-auto max-w-4xl">
          <SectionTitle label={`[ ${t.sections.faqTitle} ]`} title={t.sections.faqSubtitle} />
          <div className="mt-12 border-t border-[#1a1a2e]">
            {faqs.map(([question, answer], index) => {
              const isOpen = openFaq === index;
              const answerId = `faq-answer-${index}`;
              return (
                <button
                  key={question}
                  type="button"
                  id={`faq-trigger-${index}`}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  data-open={isOpen ? 'true' : undefined}
                  className="faq-row w-full border-b border-[#1a1a2e] py-6 text-left"
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                >
                  <span className="faq-accent" aria-hidden="true" />
                  <div className="flex items-start gap-5">
                    <span className="font-mono text-sm text-[#d4af37]">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-white">{question}</h3>
                      <div id={answerId} className={`faq-answer ${isOpen ? "open" : ""}`}>
                        <p>{answer}</p>
                      </div>
                    </div>
                    <span className={`faq-plus ${isOpen ? "open" : ""}`}>+</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <DelphiTerminal />
    </main>
  );
}

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#d4af37]">{label}</p>
      <h2 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">{title}</h2>
    </div>
  );
}

function DiagramColumn({
  title,
  items,
  activeIndex,
  plannedStart,
}: {
  title: string;
  items: string[];
  activeIndex: number;
  plannedStart?: number;
}) {
  return (
    <div className="diagram-column">
      <p className="mb-5 font-mono text-xs uppercase tracking-[0.28em] text-[#d4af37]">{title}</p>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item}
            className={`diagram-item ${
              index === activeIndex && (plannedStart === undefined || index < plannedStart) ? 'diagram-item--active' : ''
            } ${plannedStart !== undefined && index >= plannedStart ? 'opacity-45' : ''}`.trim()}
            data-active={index === activeIndex && (plannedStart === undefined || index < plannedStart) ? 'true' : undefined}
          >
            <span>{item}</span>
            {index <= activeIndex && (plannedStart === undefined || index < plannedStart) ? (
              <span
                className={`diagram-item-ping ${index === activeIndex ? 'is-live' : 'is-muted'}`}
                aria-hidden="true"
              />
            ) : null}
            {index === activeIndex && (plannedStart === undefined || index < plannedStart) ? (
              <span className="ml-auto text-[10px] uppercase tracking-[0.28em] text-[#f5d060]">live</span>
            ) : plannedStart !== undefined && index >= plannedStart ? (
              <span className="ml-auto text-[#555566]">(planned)</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeTerminal({ activeStep }: { activeStep: number }) {
  const cursorTop = 0.6 + activeStep * 4.7;

  return (
    <div className="code-terminal bracket-card flex flex-col overflow-hidden">
      <Brackets />
      
      {/* Utility Row */}
      <div className="flex items-center justify-between border-b border-[#1a1a2e] bg-white/[0.02] px-5 py-3">
        <div className="flex gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
        </div>
        <div className="flex gap-4 font-mono text-[9px] uppercase tracking-widest">
          <button type="button" className="text-[#555566] hover:text-[#d4af37]">Copy Snippet</button>
          <a href="/learn" className="text-[#555566] hover:text-[#d4af37]">Open Docs</a>
        </div>
      </div>

      <div className="relative flex-1">
        <span className="code-terminal-scanner z-0" aria-hidden="true" />
        <span className="code-terminal-cursor z-0" style={{ transform: `translateY(${cursorTop}rem)` }} aria-hidden="true" />
        <pre className="overflow-x-auto p-5 text-sm leading-7 text-[#d8d8d8] sm:p-8">
          <code className="relative z-10 grid gap-1">
            <div className={activeStep === 0 ? 'text-white' : 'text-[#555566] transition-colors'}>
              <span className="text-[#d4af37]">arc@sdk:~$</span> pnpm add @arc-ecosystem/arc-kit
            </div>
            <div className={`mt-4 ${activeStep === 0 ? 'text-white' : 'text-[#555566] transition-colors'}`}>
              <span className="text-[#d4af37]">import</span> {"{ kit }"} <span className="text-[#d4af37]">from</span>{" "}
              <span className="text-white">'@arc-ecosystem/arc-kit'</span>
            </div>
            <div className={`mt-2 ${activeStep === 1 ? 'text-white' : 'text-[#555566] transition-colors'}`}>
              <span className="text-[#555566]">// 1. Initiate settlement</span>
            </div>
            <div className={activeStep === 1 ? 'text-white' : 'text-[#555566] transition-colors'}>
              <span className="text-[#d4af37]">const</span> tx = <span className="text-[#d4af37]">await</span> kit.send(&#123;
            </div>
            <div className={activeStep === 1 ? 'text-white' : 'text-[#555566] transition-colors'}>  to: <span className="text-white">'0xB87B...4365'</span>,</div>
            <div className={activeStep === 1 ? 'text-white' : 'text-[#555566] transition-colors'}>  amount: <span className="text-white">'10.00'</span>,</div>
            <div className={activeStep === 1 ? 'text-white' : 'text-[#555566] transition-colors'}>  token: <span className="text-white">'USDC'</span></div>
            <div className={activeStep === 1 ? 'text-white' : 'text-[#555566] transition-colors'}>
              &#125;)
            </div>
            <div className={`mt-4 ${activeStep === 2 ? 'text-white' : 'text-[#555566] transition-colors'}`}>
              <span className="text-[#555566]">// 2. Track on-chain</span>
            </div>
            <div className={activeStep === 2 ? 'text-white' : 'text-[#555566] transition-colors'}>
              console.log(<span className="text-[#d4af37]">{`\`Confirmed: \${tx.hash}\``}</span>)
            </div>
          </code>
        </pre>
      </div>

      {/* Lower Info Band */}
      <div className="flex items-center justify-between border-t border-[#1a1a2e] bg-white/[0.01] px-5 py-3 font-mono text-[9px] uppercase tracking-widest text-[#444]">
        <span>Expected integration: &lt; 15 min</span>
        <span className="text-[#d4af37]/60">Type-safe helpers included</span>
      </div>
    </div>
  );
}

function ResourceCard({
  icon,
  label,
  title,
  text,
  footer,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  text: string;
  footer: string;
  href: string | null;
}) {
  if (!href) {
    return (
      <div className="resource-card bracket-card group p-6" aria-disabled="true">
        <Brackets />
        <div className="resource-card-icon grid min-h-56 place-items-center text-white">{icon}</div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#d4af37]">{label}</p>
        <h3 className="resource-card-title mt-3 text-3xl font-black">{title}</h3>
        <p className="mt-4 min-h-20 leading-7 text-[#8b8b8b]">{text}</p>
        <p className="resource-card-footer mt-7 font-mono text-xs uppercase tracking-[0.2em] text-white">
          {footer} <ArrowRight className="resource-card-arrow transition-transform" size={15} />
        </p>
      </div>
    );
  }

  const external = isExternalUrl(href);
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="resource-card bracket-card group p-6"
    >
      <Brackets />
      <div className="resource-card-icon grid min-h-56 place-items-center text-white">{icon}</div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#d4af37]">{label}</p>
      <h3 className="resource-card-title mt-3 text-3xl font-black">{title}</h3>
      <p className="mt-4 min-h-20 leading-7 text-[#8b8b8b]">{text}</p>
      <p className="resource-card-footer mt-7 font-mono text-xs uppercase tracking-[0.2em] text-white">
        {footer} <ArrowRight className="resource-card-arrow transition-transform" size={15} />
      </p>
    </a>
  );
}
