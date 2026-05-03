import Navbar from "@/components/Navbar";

export default function LaunchpadPage() {
  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <p className="text-xl" style={{ color: "var(--fg)", opacity: 0.6 }}>
          Token Launchpad — Coming Soon
        </p>
      </main>
    </div>
  );
}
