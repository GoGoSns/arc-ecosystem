"use client";

import {
  ArrowRight,
  ChevronRight,
  FileText,
  Github,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import AppSwitcher from "@/components/AppSwitcher";
import VoiceTour from "@/components/VoiceTour";
import { getArcAppUrl, isExternalUrl } from "@/lib/arcAppLinks";
import { useVoiceTourStore, type VoiceTourSectionId } from "@/lib/voiceTourStore";
import { translations, type Lang } from "@/lib/translations";
import LanguageToggle from "@/components/LanguageToggle";

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

const arcPayUrl = getArcAppUrl('pay');
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
      { name: "Bounty Board", href: getArcAppUrl('creator', '/bounty'), soon: true },
      { name: "Marketplace", href: getArcAppUrl('creator', '/marketplace'), soon: true },
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
      { name: "Play to Earn", href: getArcAppUrl('play', '/games'), soon: true },
      { name: "Token Launchpad", href: getArcAppUrl('play', '/launchpad'), soon: true },
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
  { title: "CONNECT", body: "Reusable wagmi + Circle AppKit hooks" },
  { title: "SEND", body: "USDC payments via kit.send()" },
  { title: "CONFIRM", body: "Tx hash + ArcScan link" },
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
  const primaryNavLinks = [
    { href: '#top', label: t.nav.home },
    { href: '/value', label: t.nav.value },
    { href: '/quests', label: t.nav.quests },
    { href: '/roadmap', label: t.nav.roadmap },
    { href: '/showcase', label: t.nav.showcase },
    { href: '/jobs', label: t.nav.jobs },
    { href: '/roulette', label: t.nav.roulette },
    { href: '/game', label: t.nav.game },
    { href: '/market', label: t.nav.market },
    { href: '/events', label: t.nav.events },
    { href: '/race', label: t.nav.race },
    { href: '/drops', label: t.nav.drops },
    { href: '/vault', label: t.nav.vault },
    { href: '/signals', label: t.nav.signals },
    { href: '/learn', label: t.nav.learn },
    { href: '/glossary', label: t.nav.glossary },
    { href: '#faq', label: t.nav.faq },
  ];
  const utilityNavLinks = [
    { href: '#apps', label: t.nav.apps },
    { href: '#architecture', label: t.nav.architecture },
    { href: '#sdk', label: t.nav.sdk },
    { href: '#resources', label: t.nav.docs },
    { href: '/stats', label: t.nav.stats },
    { href: '/feedback', label: t.nav.feedback },
    { href: '/forum', label: t.nav.forum },
    { href: '/node', label: t.nav.node },
  ];

  return (
    <main className="page-shell min-h-screen overflow-x-clip text-white">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.18em] text-white">
            <span className="relative grid h-8 w-8 place-items-center border border-[#c9a84c]/60">
              <span className="h-3.5 w-3.5 rotate-45 border border-[#c9a84c]" />
            </span>
            Arc Ecosystem
          </a>
          <div
            className="hidden flex-1 items-center justify-center gap-4 overflow-x-auto whitespace-nowrap font-mono text-xs uppercase text-[#777] md:flex"
            aria-label="Primary navigation"
          >
            {primaryNavLinks.map((item) => (
              <a key={item.href} href={item.href} className="nav-link">
                {item.label}
              </a>
            ))}
            <span className="mx-2 h-4 w-px bg-[#2a2a2a]" aria-hidden="true" />
            {utilityNavLinks.map((item) => (
              <a key={item.href} href={item.href} className="nav-link">
                {item.label}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle currentLang={lang} onChange={handleLangChange} />
            <AppSwitcher />
            <a href="#apps" className="bracket-button">{t.nav.launch}</a>
          </div>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="grid h-10 w-10 place-items-center border border-[#2a2a2a] text-[#c9a84c] transition-colors hover:border-[#c9a84c]/60 md:hidden"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {menuOpen ? (
          <div id="mobile-nav" className="border-t border-[#2a2a2a] bg-[#0a0a0a] px-4 py-4 font-mono text-sm uppercase text-[#aaa] md:hidden">
            <p className="pb-2 text-[10px] tracking-[0.3em] text-[#777]">{t.home.diagram.core}</p>
            {primaryNavLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block border-b border-[#1f1f1f] py-3"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <p className="pb-2 pt-4 text-[10px] tracking-[0.3em] text-[#777]">{t.home.diagram.utility}</p>
            {utilityNavLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block border-b border-[#1f1f1f] py-3"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-4">
              <LanguageToggle currentLang={lang} onChange={handleLangChange} />
            </div>
          </div>
        ) : null}
      </nav>

      <section id="top" className="hero-grid relative overflow-hidden px-4 pt-16">
        <div className="hex-field" aria-hidden="true">
          <span>0xB87B6D1a56bB7942bd07b6B0e9540a63b3dA4365</span>
          <span>0x62f9bbff19385f6ffb287ff7451b2229</span>
          <span>0xCf87F73c93Ac2ed7b34Bc02f</span>
          <span>0xD844A121e7d690Bd9B3d</span>
          <span>chainId:5042002</span>
        </div>
        <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 py-20 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:py-28">
          <div className="reveal relative z-10 max-w-3xl text-left" style={revealDelay(80)}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-[#c9a84c]/25 bg-[#c9a84c]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#f4dc9f]">
                Dark + arc gold
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-white/[0.02] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#bdbdbd]">
                <span className="pulse-dot" />
                Controlled motion
              </span>
            </div>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c]">{t.hero.tagline}</p>
            <h1
              className="mt-8 max-w-4xl text-[clamp(3.4rem,8vw,8rem)] font-black uppercase leading-[0.88] tracking-[-0.05em] text-white"
              data-text={t.hero.title}
            >
              <span className="block">{heroFirst}</span>
              <span className="block text-[#c9a84c]">{heroRest}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c7c7c7] sm:text-xl">
              {t.hero.subtitle}
            </p>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#9a9a9a] sm:text-lg">
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
                <span aria-disabled="true" className="primary-button cursor-not-allowed opacity-50">
                  {t.hero.ctaPrimary} <ArrowRight size={16} />
                </span>
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
                <div key={item.label} className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#8a8a8a]">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal relative z-10" style={revealDelay(180)}>
            <div className="bracket-card relative overflow-hidden p-6 sm:p-8">
              <Brackets />
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#c9a84c]">// live system map</p>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#30d158]/20 bg-[#30d158]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#a6f4bf]">
                  <span className="green-dot" />
                  Synced
                </span>
              </div>
              <h2 className="mt-5 text-3xl font-black uppercase leading-tight sm:text-4xl">
                Three apps. One network language.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#9a9a9a]">
                Stablecoin payments, creator monetization, and play systems share the same visual grammar and
                infrastructure story.
              </p>
              <div className="mt-6 space-y-3">
                {appCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4 transition-colors hover:border-[#c9a84c]/25"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#8a8a8a]">{card.label}</p>
                        <h3 className="mt-1 text-lg font-black uppercase text-white">{card.title}</h3>
                      </div>
                      <span className="soon-badge">{card.features.length} routes</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#9a9a9a]">{card.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#8a8a8a]">Chain</p>
                  <p className="mt-2 text-sm font-semibold text-white">5042002</p>
                </div>
                <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#8a8a8a]">Gas</p>
                  <p className="mt-2 text-sm font-semibold text-white">USDC native</p>
                </div>
                <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#8a8a8a]">Latency</p>
                  <p className="mt-2 text-sm font-semibold text-white">&lt; 1s blocks</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#2a2a2a] bg-white/[0.015] px-4 py-5 font-mono text-xs uppercase tracking-[0.22em] text-[#aaa]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <span>[ {t.stats.apps} &middot; 3 ]</span><span className="text-[#333]">|</span>
          <span>[ {t.stats.features} &middot; 13 ]</span><span className="text-[#333]">|</span>
          <span>[ {t.stats.network} &middot; {t.stats.networkValue} ]</span><span className="text-[#333]">|</span>
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
                  ? 'ring-1 ring-[#c9a84c]/45 shadow-[0_24px_80px_rgba(201,168,76,0.12)]'
                  : ''
              }`}
              style={revealDelay(120 + idx * 90)}
            >
              <Brackets />
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">{appCardLabels[idx]}</p>
                <button
                    type="button"
                    onClick={() => requestVoiceTour('section', card.voiceId)}
                    aria-label={`${t.voiceTour.listen} ${card.title}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/25 bg-[#c9a84c]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#f4dc9f] transition-colors hover:bg-[#c9a84c]/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60"
                  >
                    {t.voiceTour.listen}
                  </button>
                </div>
                <h3 className="mt-5 text-4xl font-black tracking-wide">{cardDesc[idx].title.toUpperCase()}</h3>
                <p className="mt-4 min-h-14 text-[#8b8b8b]">{cardDesc[idx].description}</p>
                <div className="mt-8 space-y-3">
                  {card.features.map((feature) => (
                    feature.href && !feature.soon ? (
                      <a
                        key={feature.name}
                        href={feature.href}
                        target={isExternalUrl(feature.href) ? "_blank" : undefined}
                        rel={isExternalUrl(feature.href) ? "noopener noreferrer" : undefined}
                        className="feature-link"
                      >
                        <span>{feature.name}</span>
                        <span className="ml-auto flex items-center gap-2">
                          <span className="soon-badge soon-badge--pulse">{t.home.soon}</span>
                          <ChevronRight className="feature-arrow pillars-arrow" size={16} />
                        </span>
                      </a>
                    ) : (
                      <span
                        key={feature.name}
                        aria-disabled="true"
                        className="feature-link cursor-not-allowed opacity-45"
                      >
                        <span>{feature.name}</span>
                        <span className="ml-auto flex items-center gap-2">
                          <span className="soon-badge soon-badge--pulse">{t.home.soon}</span>
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

      <section id="architecture" className="section border-y border-[#141414] bg-white/[0.01]">
        <div className="reveal mx-auto max-w-7xl">
          <SectionTitle label={`// ${t.sections.architectureTitle.toLowerCase()}`} title={t.sections.architectureSubtitle} />
          <div className="architecture mt-14 grid gap-8 lg:grid-cols-[1fr_1.1fr_1fr]">
            <span className="architecture-flow architecture-flow-left" aria-hidden="true" />
            <span className="architecture-flow architecture-flow-right" aria-hidden="true" />
            <DiagramColumn title={t.home.diagram.input} items={wallets} activeIndex={0} />
            <div className="bracket-card core-box p-8 text-center">
              <Brackets />
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#c9a84c]">{t.home.diagram.core}</p>
              <h3 className="mt-4 text-4xl font-black">{t.home.diagram.arcNetwork}</h3>
              <div className="mt-8 space-y-3 font-mono text-sm text-[#aaa]">
                <p>chainId 5042002</p>
                <p>USDC native (decimals 18)</p>
                <p>Block time &lt;1s</p>
                <p className="text-white">Status: <span className="green-dot" /> LIVE</p>
              </div>
            </div>
            <DiagramColumn title={t.home.diagram.output} items={["arc-pay", "arc-creator", "arc-play", "+ shared-ui", "+ arc-kit"]} activeIndex={2} plannedStart={3} />
          </div>
          <p className="mt-10 text-center font-mono text-xs uppercase tracking-[0.24em] text-[#777]">
            Apps &middot; 3 <span className="mx-3 text-[#333]">|</span> Features &middot; 13 <span className="mx-3 text-[#333]">|</span>{" "}
            Block &middot; &lt;live&gt;
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
                  <span>[0{index + 1}]</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                  <ArrowRight className="ml-auto text-[#c9a84c]" size={18} />
                </div>
              ))}
              <div className="pt-6">
                <p className="inline-flex border border-[#2a2a2a] px-3 py-1 font-mono text-xs uppercase text-[#777]">// arc-kit &middot; coming soon</p>
                <p className="mt-5 max-w-xl leading-7 text-[#8b8b8b]">
                  A TypeScript-first SDK for building on Arc Network. Submit cross-chain USDC transactions without exposing internal complexity.
                </p>
              </div>
            </div>
            <CodeTerminal activeStep={sdkStep} />
          </div>
        </div>
      </section>

      <section id="resources" className="section border-y border-[#141414] bg-white/[0.01]">
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
                footer={t.home.resources.communityFooter}
                href={null}
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
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-[#c9a84c]">// ready</p>
            <h2 className="mx-auto mt-8 max-w-5xl text-4xl font-black uppercase leading-tight sm:text-6xl lg:text-7xl">
              {t.sections.ctaTitle}
            </h2>
            <p className="mx-auto mt-8 max-w-xl leading-7 text-[#9a9a9a]">
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
              <span aria-disabled="true" className="primary-button mt-10 cursor-not-allowed opacity-50">
                {t.home.cta.start}
              </span>
            )}
            <p className="mt-14 font-mono text-xs uppercase tracking-[0.35em] text-white/15">// arc &middot; stablecoin &middot; onchain</p>
          </div>
        </div>
      </section>

      <section id="faq" className="section pt-0">
        <div className="reveal mx-auto max-w-4xl">
          <SectionTitle label={`[ ${t.sections.faqTitle} ]`} title={t.sections.faqSubtitle} />
          <div className="mt-12 border-t border-[#2a2a2a]">
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
                  className="faq-row w-full border-b border-[#2a2a2a] py-6 text-left"
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                >
                  <span className="faq-accent" aria-hidden="true" />
                  <div className="flex items-start gap-5">
                    <span className="font-mono text-sm text-[#c9a84c]">{String(index + 1).padStart(2, "0")}</span>
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

      <footer className="border-t border-[#2a2a2a] px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 font-mono text-xs uppercase tracking-[0.16em] text-[#777] md:flex-row md:items-center md:justify-between">
          <p>&copy; 2026 Arc Ecosystem &middot; {t.footer.builtOn} &middot; by GoGo</p>
          <div className="flex gap-5">
            <span aria-disabled="true" className="nav-link cursor-not-allowed opacity-50">// X</span>
            <a href={githubHref} target="_blank" rel="noopener noreferrer" className="nav-link">// GitHub</a>
            <a href="mailto:hello@arc.ecosystem" className="nav-link">// Email</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#c9a84c]">{label}</p>
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
      <p className="mb-5 font-mono text-xs uppercase tracking-[0.28em] text-[#c9a84c]">{title}</p>
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
              <span className="ml-auto text-[10px] uppercase tracking-[0.28em] text-[#f8e7b5]">live</span>
            ) : plannedStart !== undefined && index >= plannedStart ? (
              <span className="ml-auto text-[#555]">(planned)</span>
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
    <div className="code-terminal bracket-card overflow-hidden">
      <Brackets />
      <div className="flex items-center border-b border-[#2a2a2a] px-5 py-4 font-mono text-xs text-[#777]">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="flex-1 text-center text-[#aaa]">send.ts</span>
        <span>step {activeStep + 1}/3</span>
      </div>
      <div className="relative">
        <span className="code-terminal-scanner z-0" aria-hidden="true" />
        <span className="code-terminal-cursor z-0" style={{ transform: `translateY(${cursorTop}rem)` }} aria-hidden="true" />
        <pre className="overflow-x-auto p-5 text-sm leading-7 text-[#d8d8d8] sm:p-8">
          <code className="relative z-10 grid gap-1">
            <div className={activeStep === 0 ? 'text-white' : 'text-[#d8d8d8]'}>
              <span className="text-[#c9a84c]">arc@sdk:~$</span> node send.ts
            </div>
            <div className={activeStep === 0 ? 'text-white' : 'text-[#d8d8d8]'}>
              <span className="text-[#c9a84c]">import</span> {"{ kit }"} <span className="text-[#c9a84c]">from</span>{" "}
              <span className="text-white">'@arc-ecosystem/arc-kit'</span>
            </div>
            <div className={activeStep === 1 ? 'text-white' : 'text-[#777]'}>
              <span className="text-[#777]">// arc testnet, native USDC</span>
            </div>
            <div className={activeStep === 1 ? 'text-white' : 'text-[#d8d8d8]'}>
              <span className="text-[#c9a84c]">const</span> tx = <span className="text-[#c9a84c]">await</span> kit.send(&#123;
            </div>
            <div className={activeStep === 1 ? 'text-white' : 'text-[#d8d8d8]'}>  to: <span className="text-white">'0xB87B6D1a56bB7942bd07b6B0e9540a63b3dA4365'</span>,</div>
            <div className={activeStep === 1 ? 'text-white' : 'text-[#d8d8d8]'}>  amount: <span className="text-white">'10'</span>,</div>
            <div className={activeStep === 1 ? 'text-white' : 'text-[#d8d8d8]'}>  token: <span className="text-white">'USDC'</span>,</div>
            <div className={activeStep === 1 ? 'text-white' : 'text-[#d8d8d8]'}>  chain: <span className="text-white">'Arc_Testnet'</span></div>
            <div className={activeStep === 1 ? 'text-white' : 'text-[#d8d8d8]'}>
              &#125;)
            </div>
            <div className={activeStep === 2 ? 'text-white' : 'text-[#d8d8d8]'}>
              console.log(tx.hash)
            </div>
            <div className={activeStep === 2 ? 'text-white' : 'text-[#777]'}>
              <span className="text-[#777]">// 0x62f9bbff19385f6ffb287ff7451b2229...</span>
            </div>
          </code>
        </pre>
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
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">{label}</p>
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
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">{label}</p>
      <h3 className="resource-card-title mt-3 text-3xl font-black">{title}</h3>
      <p className="mt-4 min-h-20 leading-7 text-[#8b8b8b]">{text}</p>
      <p className="resource-card-footer mt-7 font-mono text-xs uppercase tracking-[0.2em] text-white">
        {footer} <ArrowRight className="resource-card-arrow transition-transform" size={15} />
      </p>
    </a>
  );
}
