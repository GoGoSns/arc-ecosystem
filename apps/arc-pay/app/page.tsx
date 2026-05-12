import Link from "next/link";
import { QrCode, Users, FileText, Briefcase, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";

const features = [
  {
    title: "QR Payment",
    description: "Send and receive USDC instantly with a QR code scan.",
    icon: QrCode,
    href: "/qr",
    comingSoon: false,
  },
  {
    title: "Split the Bill",
    description: "Divide expenses among friends with automatic USDC splits.",
    icon: Users,
    href: "/split",
    comingSoon: false,
  },
  {
    title: "Invoice",
    description: "Create and send professional USDC payment invoices.",
    icon: FileText,
    href: "/invoice",
    comingSoon: false,
  },
  {
    title: "Payroll",
    description: "Automate recurring USDC payroll for your team.",
    icon: Briefcase,
    href: "/payroll",
    comingSoon: false,
  },
  {
    title: "Escrow",
    description: "Secure conditional USDC payments with smart escrow.",
    icon: Lock,
    href: "/escrow",
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
            Arc Pay
          </h1>
          <p className="text-base sm:text-xl" style={{ color: "var(--fg)", opacity: 0.65 }}>
            USDC payments on Arc Testnet
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
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
