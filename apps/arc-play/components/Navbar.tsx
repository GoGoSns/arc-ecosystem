import ThemeToggle from "./ThemeToggle";
import WalletButton from "./WalletButton";

export default function Navbar() {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-[var(--border)]"
      style={{ backgroundColor: "var(--bg-nav)", backdropFilter: "blur(12px)" }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight text-[var(--accent)]">
          Arc Play
        </span>
        <div className="flex items-center gap-2">
          <WalletButton />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
