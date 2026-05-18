import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import AssistantWidget from "@/components/AssistantWidget";
import { WalletProvider } from "@/contexts/WalletContext";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arc Ecosystem - Three Apps, One USDC Economy",
  description: "Pay anyone, monetize creativity, play to earn - all powered by stablecoin rails on Arc Network.",
  icons: {
    icon: "/brand/arc-favicon.svg",
    shortcut: "/brand/arc-favicon.svg",
    apple: "/brand/arc-favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} font-sans`}>
        <WalletProvider>
          {children}
          <AssistantWidget />
        </WalletProvider>
      </body>
    </html>
  );
}
