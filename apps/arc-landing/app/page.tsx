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
import { getArcAppUrl, isExternalUrl } from "@/lib/arcAppLinks";
import { translations, type Lang } from "@/lib/translations";
import LanguageToggle from "@/components/LanguageToggle";

type Feature = {
  name: string;
  href: string | null;
  soon?: boolean;
};

type AppCard = {
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

const appCards = [
  {
    label: "// 01 · payments",
    title: "ARC PAY",
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
] satisfies AppCard[];

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
  const primaryNavLinks = [
    { href: '#top', label: t.nav.home },
    { href: '/value', label: t.nav.value },
    { href: '/quests', label: t.nav.quests },
    { href: '/roadmap', label: t.nav.roadmap },
    { href: '/showcase', label: t.nav.showcase },
    { href: '/jobs', label: t.nav.jobs },
    { href: '/roulette', label: t.nav.roulette },
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
    <main className="min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
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
            <p className="pb-2 text-[10px] tracking-[0.3em] text-[#777]">CORE</p>
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
            <p className="pb-2 pt-4 text-[10px] tracking-[0.3em] text-[#777]">UTILITY</p>
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

      <section id="top" className="hero-grid relative flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="hex-field" aria-hidden="true">
          <span>0xB87B6D1a56bB7942bd07b6B0e9540a63b3dA4365</span>
          <span>0x62f9bbff19385f6ffb287ff7451b2229</span>
          <span>0xCf87F73c93Ac2ed7b34Bc02f</span>
          <span>0xD844A121e7d690Bd9B3d</span>
          <span>chainId:5042002</span>
        </div>
        <div className="reveal relative z-10 mx-auto max-w-6xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c]">{t.hero.tagline}</p>
          <h1
            className="glitch mt-8 text-[3.5rem] font-black uppercase leading-none text-white sm:text-[6rem] lg:text-[8.5rem]"
            data-text={t.hero.title}
          >
            {heroFirst} <span className="text-[#c9a84c]">{heroRest}</span>
          </h1>
          <p className="mt-6 font-mono text-sm uppercase tracking-[0.28em] text-[#777] sm:text-base">
            {t.hero.subtitle}
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#9a9a9a] sm:text-lg">
            {t.hero.description}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
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

      <section id="apps" className="section">
        <div className="reveal mx-auto max-w-7xl">
          <SectionTitle label={`// ${t.sections.pillarsTitle.toLowerCase()}`} title={t.sections.pillarsSubtitle} />
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {appCards.map((card, idx) => (
              <article key={card.title} className="bracket-card flex min-h-[560px] flex-col p-6 sm:p-8">
                <Brackets />
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">{card.label}</p>
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
                          <span className="soon-badge">soon</span>
                          <ChevronRight className="feature-arrow" size={16} />
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
                          <span className="soon-badge">soon</span>
                          <ChevronRight className="feature-arrow" size={16} />
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
                    {card.cta} <ArrowRight size={15} />
                  </a>
                ) : (
                  <span aria-disabled="true" className="bracket-button mt-auto w-full justify-center cursor-not-allowed opacity-50">
                    {card.cta} <ArrowRight size={15} />
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
            <DiagramColumn title="INPUT" items={wallets} activeIndex={0} />
            <div className="bracket-card core-box p-8 text-center">
              <Brackets />
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#c9a84c]">CORE</p>
              <h3 className="mt-4 text-4xl font-black">ARC NETWORK</h3>
              <div className="mt-8 space-y-3 font-mono text-sm text-[#aaa]">
                <p>chainId 5042002</p>
                <p>USDC native (decimals 18)</p>
                <p>Block time &lt;1s</p>
                <p className="text-white">Status: <span className="green-dot" /> LIVE</p>
              </div>
            </div>
            <DiagramColumn title="OUTPUT" items={["arc-pay", "arc-creator", "arc-play", "+ shared-ui", "+ arc-kit"]} activeIndex={2} plannedStart={3} />
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
              {["CONNECT|Reusable wagmi + Circle AppKit hooks", "SEND|USDC payments via kit.send()", "CONFIRM|Tx hash + ArcScan link"].map((step, index) => {
                const [title, body] = step.split("|");
                return (
                  <div key={title} className="step-row">
                    <span>[0{index + 1}]</span>
                    <div><h3>{title}</h3><p>{body}</p></div>
                    <ArrowRight className="ml-auto text-[#c9a84c]" size={18} />
                  </div>
                );
              })}
              <div className="pt-6">
                <p className="inline-flex border border-[#2a2a2a] px-3 py-1 font-mono text-xs uppercase text-[#777]">// arc-kit &middot; coming soon</p>
                <p className="mt-5 max-w-xl leading-7 text-[#8b8b8b]">
                  A TypeScript-first SDK for building on Arc Network. Submit cross-chain USDC transactions without exposing internal complexity.
                </p>
              </div>
            </div>
            <CodeTerminal />
          </div>
        </div>
      </section>

      <section id="resources" className="section border-y border-[#141414] bg-white/[0.01]">
        <div className="reveal mx-auto max-w-7xl">
          <SectionTitle label={t.sections.resourcesTitle.toLowerCase()} title="Read the latest. Join the community." />
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            <ResourceCard icon={<FileText size={42} />} label="[ RESOURCES ]" title="DOCUMENTATION" text="Architecture overview, integration guides, and API reference for Arc Ecosystem." footer="READ DOCS" href={docsHref} />
            <ResourceCard icon={<Github size={42} />} label="[ OPEN SOURCE ]" title="GITHUB" text="All apps, packages, and SDKs are open source. Contribute, fork, or audit." footer="VIEW REPO" href={githubHref} />
            <ResourceCard icon={<XLogo />} label="[ COMMUNITY ]" title={"X · UPDATES"} text="Follow @gogo for protocol updates, demos, and ecosystem developments." footer="COMING SOON" href={null} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="reveal bracket-card mx-auto max-w-7xl px-5 py-20 text-center sm:px-10 lg:py-28">
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
              GET STARTED
            </a>
          ) : (
            <span aria-disabled="true" className="primary-button mt-10 cursor-not-allowed opacity-50">
              GET STARTED
            </span>
          )}
          <p className="mt-14 font-mono text-xs uppercase tracking-[0.35em] text-white/15">// arc &middot; stablecoin &middot; onchain</p>
        </div>
      </section>

      <section id="faq" className="section pt-0">
        <div className="reveal mx-auto max-w-4xl">
          <SectionTitle label={`[ ${t.sections.faqTitle} ]`} title="Frequently Asked Questions" />
          <div className="mt-12 border-t border-[#2a2a2a]">
            {faqs.map(([question, answer], index) => {
              const isOpen = openFaq === index;
              return (
                <button
                  key={question}
                  className="faq-row w-full border-b border-[#2a2a2a] py-6 text-left"
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                >
                  <div className="flex items-start gap-5">
                    <span className="font-mono text-sm text-[#c9a84c]">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-white">{question}</h3>
                      <div className={`faq-answer ${isOpen ? "open" : ""}`}>
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
          <div key={item} className={`diagram-item ${plannedStart !== undefined && index >= plannedStart ? "opacity-45" : ""}`}>
            <span>{item}</span>
            {index <= activeIndex && (plannedStart === undefined || index < plannedStart) ? <span className="green-dot" /> : null}
            {plannedStart !== undefined && index >= plannedStart ? <span className="ml-auto text-[#555]">(planned)</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeTerminal() {
  return (
    <div className="bracket-card overflow-hidden">
      <Brackets />
      <div className="flex items-center border-b border-[#2a2a2a] px-5 py-4 font-mono text-xs text-[#777]">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="flex-1 text-center text-[#aaa]">send.ts</span>
        <span>step 1/3</span>
      </div>
      <pre className="overflow-x-auto p-5 text-sm leading-7 text-[#d8d8d8] sm:p-8">
        <code>
          <span className="text-[#c9a84c]">arc@sdk:~$</span> node send.ts{"\n\n"}
          <span className="text-[#c9a84c]">import</span> {"{ kit }"} <span className="text-[#c9a84c]">from</span> <span className="text-white">'@arc-ecosystem/arc-kit'</span>{"\n\n"}
          <span className="text-[#777]">// arc testnet, native USDC</span>{"\n"}
          <span className="text-[#c9a84c]">const</span> tx = <span className="text-[#c9a84c]">await</span> kit.send(&#123;{"\n"}
          {"  "}to: <span className="text-white">'0xB87B6D1a56bB7942bd07b6B0e9540a63b3dA4365'</span>,{"\n"}
          {"  "}amount: <span className="text-white">'10'</span>,{"\n"}
          {"  "}token: <span className="text-white">'USDC'</span>,{"\n"}
          {"  "}chain: <span className="text-white">'Arc_Testnet'</span>{"\n"}
          &#125;){"\n\n"}
          console.log(tx.hash){"\n"}
          <span className="text-[#777]">// 0x62f9bbff19385f6ffb287ff7451b2229...</span>
        </code>
      </pre>
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
        <div className="grid min-h-56 place-items-center text-white transition-colors group-hover:text-[#c9a84c]">{icon}</div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">{label}</p>
        <h3 className="mt-3 text-3xl font-black">{title}</h3>
        <p className="mt-4 min-h-20 leading-7 text-[#8b8b8b]">{text}</p>
        <p className="mt-7 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-white">
          {footer} <ArrowRight className="transition-transform group-hover:translate-x-1" size={15} />
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
      <div className="grid min-h-56 place-items-center text-white transition-colors group-hover:text-[#c9a84c]">{icon}</div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">{label}</p>
      <h3 className="mt-3 text-3xl font-black">{title}</h3>
      <p className="mt-4 min-h-20 leading-7 text-[#8b8b8b]">{text}</p>
      <p className="mt-7 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-white">
        {footer} <ArrowRight className="transition-transform group-hover:translate-x-1" size={15} />
      </p>
    </a>
  );
}
