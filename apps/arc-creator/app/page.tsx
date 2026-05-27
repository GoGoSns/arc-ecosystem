import Link from "next/link";
import { Coffee, Repeat, Trophy, Briefcase } from "lucide-react";
import Navbar from "@/components/Navbar";

const features = [
  {
    title: "Tip Jar",
    description: "Receive one-tap USDC tips from supporters.",
    icon: Coffee,
    href: "/tip",
  },
  {
    title: "Subscription",
    description: "Recurring USDC subscriptions for content.",
    icon: Repeat,
    href: "/subscription",
  },
  {
    title: "Bounty Board",
    description: "Post tasks, pay on completion.",
    icon: Trophy,
    href: "/bounty",
  },
  {
    title: "Freelance Marketplace",
    description: "Full-service marketplace with escrow.",
    icon: Briefcase,
    href: "/marketplace",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight" style={{ color: "var(--accent)" }}>
            Arc Creator
          </h1>
          <p className="text-base sm:text-xl" style={{ color: "var(--fg)", opacity: 0.65 }}>
            Monetize your creativity on Arc Testnet
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="sweep rounded-xl p-4 sm:p-6 flex flex-col gap-4 transition-colors"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(201,168,76,0.12)" }}
                >
                  <Icon size={20} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <h2
                    className="font-semibold mb-1"
                    style={{ color: "var(--fg)" }}
                  >
                    {feature.title}
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--fg)", opacity: 0.55 }}>
                    {feature.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
