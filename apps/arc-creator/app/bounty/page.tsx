import Link from "next/link";
import { Trophy } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function BountyPage() {
  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-20 flex flex-col items-center justify-center gap-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(201,168,76,0.12)" }}
        >
          <Trophy size={28} style={{ color: "var(--accent)" }} />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--accent)" }}>
            Bounty Board
          </h1>
          <p className="text-base leading-relaxed max-w-sm" style={{ color: "var(--fg)", opacity: 0.55 }}>
            Post tasks and pay contributors in USDC on completion — coming soon.
          </p>
        </div>
        <Link
          href="/"
          className="sweep px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors"
          style={{ border: "1px solid var(--border)", background: "var(--card)", color: "var(--fg)" }}
        >
          ← Back to dashboard
        </Link>
      </main>
    </div>
  );
}
