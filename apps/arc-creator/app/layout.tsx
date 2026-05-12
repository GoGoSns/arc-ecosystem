import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Web3Provider from "@/components/Web3Provider";
import AssistantWidget from "@/components/AssistantWidget";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arc Creator — Monetize Your Audience",
  description: "Receive tips, run subscriptions, post bounties, and sell services on Arc Network. Powered by USDC.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Runs before React hydrates — applies saved theme to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('arc-creator-theme')==='light')document.documentElement.classList.remove('dark');}catch(e){}})();`,
          }}
        />
        <Web3Provider>
          {children}
          <AssistantWidget />
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}
