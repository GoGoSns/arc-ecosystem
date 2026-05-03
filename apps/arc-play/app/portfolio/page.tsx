import Navbar from "@/components/Navbar";

export default function PortfolioPage() {
  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <p className="text-xl" style={{ color: "var(--fg)", opacity: 0.6 }}>
          Portfolio Tracker — Coming Soon
        </p>
      </main>
    </div>
  );
}
