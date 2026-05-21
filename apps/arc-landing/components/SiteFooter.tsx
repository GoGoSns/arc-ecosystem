import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="bg-[#050508] border-t border-[#1a1a2e] text-[#f0f0f5]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        {/* Main Grid */}
        <div className="grid grid-cols-2 gap-12 lg:grid-cols-5 lg:gap-8">
          {/* COLUMN 1: Brand */}
          <div className="col-span-2 lg:col-span-1 space-y-6">
            <div className="text-xl font-bold tracking-wider">
              ARC <span className="text-[#d4af37]">ECOSYSTEM</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#f0f0f5]">Build, pay, and play on Arc Testnet.</p>
              <p className="text-sm leading-relaxed text-[#8a8a9a]">
                A complete Web3 ecosystem for payments, creators, and on-chain games — powered by native USDC on Arc.
              </p>
            </div>
            <div className="flex items-center space-x-5 pt-2">
              <a 
                href="https://x.com/0xGoGochain" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#8a8a9a] transition-colors hover:text-[#d4af37]" 
                aria-label="X (Twitter)"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="https://github.com/GoGoSns/arc-ecosystem" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#8a8a9a] transition-colors hover:text-[#d4af37]" 
                aria-label="GitHub"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* COLUMN 2: Products */}
          <div className="space-y-6">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a9a]">PRODUCTS</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Arc Pay</Link></li>
              <li><Link href="/" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Arc Creator</Link></li>
              <li><Link href="/" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Arc Play</Link></li>
              <li><Link href="/game" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Games</Link></li>
              <li><Link href="#" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">AI Assistant</Link></li>
            </ul>
          </div>

          {/* COLUMN 3: Resources */}
          <div className="space-y-6">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a9a]">RESOURCES</h3>
            <ul className="space-y-3">
              <li><Link href="/learn" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Docs</Link></li>
              <li><Link href="/glossary" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Glossary</Link></li>
              <li><Link href="/learn" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Learn</Link></li>
              <li><Link href="/roadmap" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Roadmap</Link></li>
              <li><Link href="/stats" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Stats</Link></li>
            </ul>
          </div>

          {/* COLUMN 4: Network */}
          <div className="space-y-6">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a9a]">NETWORK</h3>
            <ul className="space-y-3">
              <li><a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Arcscan Explorer</a></li>
              <li><a href="https://rpc.testnet.arc.network" target="_blank" rel="noopener noreferrer" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">RPC Node</a></li>
              <li><a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Faucet</a></li>
              <li><a href="#" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Bridge</a></li>
              <li><Link href="/node" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Node Setup</Link></li>
            </ul>
          </div>

          {/* COLUMN 5: Community */}
          <div className="space-y-6">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a9a]">COMMUNITY</h3>
            <ul className="space-y-3">
              <li><a href="https://x.com/0xGoGochain" target="_blank" rel="noopener noreferrer" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">X / Twitter</a></li>
              <li><a href="#" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Discord</a></li>
              <li><a href="#" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Telegram</a></li>
              <li><a href="https://github.com/GoGoSns/arc-ecosystem" target="_blank" rel="noopener noreferrer" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">GitHub</a></li>
              <li><Link href="/events" className="text-sm text-[#8a8a9a] transition-colors hover:text-[#d4af37]">Events</Link></li>
            </ul>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-16 border-t border-[#1a1a2e] py-8">
          <div className="flex flex-wrap justify-between gap-8 md:justify-around">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#d4af37]">10+</div>
              <div className="text-[11px] uppercase tracking-wider text-[#8a8a9a]">Browser Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#d4af37]">USDC</div>
              <div className="text-[11px] uppercase tracking-wider text-[#8a8a9a]">Native Payments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#d4af37]">5042002</div>
              <div className="text-[11px] uppercase tracking-wider text-[#8a8a9a]">Chain ID</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#d4af37]">&lt; 1s</div>
              <div className="text-[11px] uppercase tracking-wider text-[#8a8a9a]">Block Time</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#1a1a2e] py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row font-mono text-xs text-[#555566]">
            <div>© 2026 Arc Ecosystem. Built by GoGo.</div>
            <div>Arc Testnet · chainId 5042002</div>
            <div className="italic">Testnet environment — tokens have no real value.</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
