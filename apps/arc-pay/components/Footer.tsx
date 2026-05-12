import Link from 'next/link';
import { ExternalLink, Globe, BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      className="mt-20 py-8 border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs opacity-50">
          <span>© 2026 Arc Ecosystem</span>
          <span>•</span>
          <span>Built on Arc Testnet</span>
          <span>•</span>
          <span>USDC Native</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="http://localhost:3003"
            className="flex items-center gap-1.5 text-xs opacity-50 hover:opacity-100 transition-opacity"
          >
            <BookOpen size={14} />
            <span>Docs</span>
          </Link>
          <a
            href="https://github.com/GoGoSns"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs opacity-50 hover:opacity-100 transition-opacity"
          >
            <ExternalLink size={14} />
            <span>GitHub</span>
          </a>
          <a
            href="https://twitter.com/arcnetwork_"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs opacity-50 hover:opacity-100 transition-opacity"
          >
            <Globe size={14} />
            <span>Twitter</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
