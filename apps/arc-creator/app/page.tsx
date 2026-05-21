import Link from "next/link";
import { Coffee, Repeat, Trophy, Briefcase } from "lucide-react";
import Navbar from "@/components/Navbar";

const features = [
  {
    title: "Tip Jar",
    description: "Receive one-tap USDC tips from supporters.",
    icon: Coffee,
    href: "/tip",
    comingSoon: false,
  },
  {
    title: "Subscription",
    description: "Recurring USDC subscriptions for content.",
    icon: Repeat,
    href: "/subscription",
    comingSoon: false,
  },
  {
    title: "Bounty Board",
    description: "Post tasks, pay on completion.",
    icon: Trophy,
    href: "/bounty",
    comingSoon: false,
  },
  {
    title: "Freelance Marketplace",
    description: "Full-service marketplace with escrow.",
    icon: Briefcase,
    href: "/marketplace",
    comingSoon: false,
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
            Monetize your creativity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            const card = (
              <div
                className="sweep rounded-xl p-4 sm:p-6 flex flex-col gap-4 transition-colors h-auto"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  opacity: feature.comingSoon ? 0.6 : 1,
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
                    className="font-semibold mb-1 flex items-center gap-2 flex-wrap"
                    style={{ color: "var(--fg)" }}
                  >
                    {feature.title}
                    {feature.comingSoon && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(201,168,76,0.12)",
                          color: "var(--accent)",
                        }}
                      >
                        Soon
                      </span>
                    )}
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--fg)", opacity: 0.55 }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            );

            return feature.comingSoon ? (
              <div key={feature.href}>{card}</div>
            ) : (
              <Link key={feature.href} href={feature.href} className="flex">
                {card}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
