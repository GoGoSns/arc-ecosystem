import type { Metadata } from "next";
import "./globals.css";
import AssistantWidget from "@/components/AssistantWidget";
import { WalletProvider } from "@/contexts/WalletContext";

export const metadata: Metadata = {
  title: "Arc Ecosystem — Three Apps, One USDC Economy",
  description: "Pay anyone, monetize creativity, play to earn — all powered by stablecoin rails on Arc Network.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
          <AssistantWidget />
        </WalletProvider>
      </body>
    </html>
  );
}
