"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle, ArrowUpRight, BadgeCheck, BriefcaseBusiness, Check, Copy, Hash,
  Heart, MessageCircle, Plus, Search, Send, ShieldCheck, Sparkles, Wallet, X,
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { getUSDCBalance, sendToAddress } from "@/lib/usdcTransfer";
import {
  COMMUNITIES, LFG_POSTS, communitySigningMessage, loadCommunityMessages, persistCommunityMessage,
  type CommunityMessage,
} from "@/lib/communityStore";

type ViewMode = "chat" | "lfg";
type TipTarget = Pick<CommunityMessage, "author" | "address">;

const shortAddress = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;
const relativeTime = (value: number) => {
  const minutes = Math.max(1, Math.floor((Date.now() - value) / 60_000));
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h`;
};

export default function CommunityHubPage() {
  const { address, isConnected, connect } = useWallet();
  const [communityId, setCommunityId] = useState(COMMUNITIES[0].id);
  const community = COMMUNITIES.find((item) => item.id === communityId) ?? COMMUNITIES[0];
  const [channelId, setChannelId] = useState(community.channels[0].id);
  const [mode, setMode] = useState<ViewMode>("chat");
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [messageState, setMessageState] = useState<"idle" | "loading" | "signing" | "sending">("loading");
  const [messageError, setMessageError] = useState("");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [replyTo, setReplyTo] = useState<CommunityMessage | null>(null);
  const [tipTarget, setTipTarget] = useState<TipTarget | null>(null);
  const [tipAmount, setTipAmount] = useState("0.50");
  const [tipConfirmed, setTipConfirmed] = useState(false);
  const [tipState, setTipState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [tipError, setTipError] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const next = await loadCommunityMessages();
        if (active) { setMessages(next); setMessageError(""); }
      } catch (error) {
        if (active) setMessageError(error instanceof Error ? error.message : "Messages could not be loaded.");
      } finally {
        if (active) setMessageState("idle");
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, communityId, channelId]);
  useEffect(() => {
    if (!address) return;
    void getUSDCBalance(address).then(setBalance);
  }, [address]);

  const channel = community.channels.find((item) => item.id === channelId) ?? community.channels[0];
  const visibleMessages = messages.filter((message) => (
    message.communityId === communityId && message.channelId === channel.id
  ));
  const visibleCommunities = COMMUNITIES.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  function chooseCommunity(nextId: string) {
    const next = COMMUNITIES.find((item) => item.id === nextId) ?? COMMUNITIES[0];
    setCommunityId(next.id);
    setChannelId(next.channels[0].id);
    setMode("chat");
  }

  async function publishMessage(body: string, reply?: string): Promise<CommunityMessage> {
    if (!address || !window.ethereum) throw new Error("MetaMask is required to publish wallet-verified messages.");
    const unsigned = { communityId, channelId: channel.id, body, replyTo: reply };
    setMessageState("signing");
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [communitySigningMessage(unsigned), address],
    }) as string;
    setMessageState("sending");
    return persistCommunityMessage(unsigned, address, signature);
  }

  async function sendMessage() {
    const body = draft.trim();
    if (!body || messageState === "signing" || messageState === "sending") return;
    if (!isConnected || !address) {
      await connect();
      return;
    }
    try {
      setMessageError("");
      const message = await publishMessage(body, replyTo?.id);
      setMessages((current) => [...current, message]);
      setDraft("");
      setReplyTo(null);
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: unknown }).code : undefined;
      setMessageError(code === 4001 ? "Signature request was rejected. The message was not posted." : error instanceof Error ? error.message : "Message could not be posted.");
    } finally {
      setMessageState("idle");
    }
  }

  async function submitTip() {
    if (!tipTarget || !tipConfirmed || tipState === "sending") return;
    const amount = Number(tipAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !/^\d+(?:\.\d{1,6})?$/.test(tipAmount)) {
      setTipError("Enter a positive USDC amount with up to 6 decimals.");
      setTipState("error");
      return;
    }
    if (!address) {
      await connect();
      return;
    }
    if (balance !== null && amount > balance) {
      setTipError(`Insufficient balance. Available: ${balance.toFixed(2)} USDC.`);
      setTipState("error");
      return;
    }
    setTipState("sending");
    setTipError("");
    const result = await sendToAddress(tipTarget.address, amount);
    if (!result.success || !result.txHash) {
      setTipError(result.error || "The transaction could not be confirmed.");
      setTipState("error");
      return;
    }
    try {
      const receiptMessage = await publishMessage(`Tipped ${tipTarget.author} ${tipAmount} USDC on Arc Testnet. Transaction: ${result.explorerUrl || `https://testnet.arcscan.app/tx/${result.txHash}`}`);
      setMessages((current) => [...current, receiptMessage]);
    } catch {
      // The transfer is already final; a rejected receipt signature must not relabel it as failed.
    }
    setBalance(await getUSDCBalance(address));
    setTipState("success");
  }

  function closeTip() {
    setTipTarget(null); setTipConfirmed(false); setTipState("idle"); setTipError("");
  }

  return (
    <main className="min-h-screen bg-[#050707] text-[#f4f7f5]">
      <div className="mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="border-b border-white/10 bg-[#080b0a] p-4 lg:border-b-0 lg:border-r">
          <div className="mb-6 flex items-center justify-between">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#80e1ff]">Arc Network</p><h1 className="mt-1 text-xl font-semibold">Community Hub</h1></div>
            <button className="rounded-xl border border-white/10 p-2 text-white/60 hover:bg-white/5" aria-label="Create community"><Plus size={18} /></button>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"><Search size={15} className="text-white/35" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a community" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></label>
          <div className="mt-4 space-y-1">
            {visibleCommunities.map((item) => (
              <button key={item.id} onClick={() => chooseCommunity(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${item.id === communityId ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-black text-black" style={{ backgroundColor: item.accent }}>{item.symbol.slice(0, 4)}</span>
                <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-sm font-medium">{item.name}{item.verified && <BadgeCheck size={14} className="text-[#80e1ff]" />}</span><span className="text-xs text-white/40">{item.online} online</span></span>
              </button>
            ))}
          </div>
          <div className="mt-7 border-t border-white/10 pt-5">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Channels</p>
            {community.channels.map((item) => <button key={item.id} onClick={() => { setChannelId(item.id); setMode("chat"); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${channel.id === item.id && mode === "chat" ? "bg-[#80e1ff]/10 text-[#80e1ff]" : "text-white/55 hover:text-white"}`}><Hash size={15} /> {item.label}</button>)}
            <button onClick={() => setMode("lfg")} className={`mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${mode === "lfg" ? "bg-[#b8ff80]/10 text-[#b8ff80]" : "text-white/55 hover:text-white"}`}><BriefcaseBusiness size={15} /> Find a crew</button>
          </div>
        </aside>

        <section className="flex min-h-[720px] min-w-0 flex-col">
          <header className="flex min-h-20 items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="min-w-0"><h2 className="flex items-center gap-2 font-semibold"><Hash size={18} className="text-[#80e1ff]" />{mode === "lfg" ? "find-a-crew" : channel.label}</h2><p className="truncate text-xs text-white/40">{mode === "lfg" ? "Form a trusted working group on Arc" : channel.description}</p></div>
            <button onClick={() => void connect()} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs hover:bg-white/[0.08]"><Wallet size={15} className="text-[#80e1ff]" />{address ? `${shortAddress(address)}${balance !== null ? ` · ${balance.toFixed(2)} USDC` : ""}` : "Connect wallet"}</button>
          </header>

          {mode === "chat" ? <>
            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-5 md:px-7">
              <div className="mb-7 rounded-2xl border border-[#80e1ff]/15 bg-[#80e1ff]/[0.04] p-5"><div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-[#80e1ff]/10 text-[#80e1ff]"><MessageCircle size={21} /></div><h3 className="text-lg font-semibold">Welcome to #{channel.label}</h3><p className="mt-1 max-w-xl text-sm leading-6 text-white/45">Discuss evidence, meet contributors and reward useful work. Messages are community content, not financial advice.</p></div>
              {visibleMessages.map((message) => {
                const replied = message.replyTo ? messages.find((item) => item.id === message.replyTo) : null;
                return <article key={message.id} className="group rounded-2xl border border-transparent p-3 hover:border-white/10 hover:bg-white/[0.025]">
                  {replied && <div className="mb-2 ml-12 truncate border-l border-white/20 pl-3 text-xs text-white/35">Replying to {replied.author}: {replied.body}</div>}
                  <div className="flex gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#80e1ff]/25 to-[#b8ff80]/10 text-xs font-bold text-[#80e1ff]">{message.author.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{message.author}</span><span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/45">{message.role}</span><span className="text-[10px] text-white/30">{relativeTime(message.createdAt)}</span></div>
                    <p className="mt-1 text-sm leading-6 text-white/75">{message.body}</p>
                    {message.tx && <a href={message.tx.url} target="_blank" rel="noreferrer" className="mt-3 flex max-w-sm items-center justify-between rounded-xl border border-[#b8ff80]/20 bg-[#b8ff80]/5 p-3 text-xs text-[#b8ff80]"><span><strong className="block text-base">{message.tx.amount} USDC</strong>Settled on Arc Testnet</span><ArrowUpRight size={17} /></a>}
                    <div className="mt-2 flex items-center gap-1 text-white/35"><button className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-white/5 hover:text-white"><Heart size={13} /> {message.reactions || ""}</button><button onClick={() => setReplyTo(message)} className="rounded-lg px-2 py-1 text-xs hover:bg-white/5 hover:text-white">Reply</button>{message.address.toLowerCase() !== address?.toLowerCase() && <button onClick={() => { setTipTarget(message); setTipState("idle"); }} className="rounded-lg px-2 py-1 text-xs text-[#b8ff80]/70 hover:bg-[#b8ff80]/5 hover:text-[#b8ff80]">Tip USDC</button>}</div>
                  </div></div>
                </article>;
              })}
              <div ref={endRef} />
            </div>
            <div className="border-t border-white/10 p-4 md:px-7">{messageError && <p className="mb-2 rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">{messageError}</p>}{replyTo && <div className="mb-2 flex items-center justify-between rounded-t-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/45"><span>Replying to <strong className="text-white/70">{replyTo.author}</strong></span><button onClick={() => setReplyTo(null)}><X size={14} /></button></div>}<div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2 focus-within:border-[#80e1ff]/35"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={1} maxLength={1000} disabled={messageState === "signing" || messageState === "sending"} placeholder={isConnected ? `Message #${channel.label}` : "Connect wallet to join the conversation"} className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-white/25 disabled:opacity-50" /><button onClick={() => void sendMessage()} disabled={messageState === "signing" || messageState === "sending"} className="grid h-10 w-10 place-items-center rounded-xl bg-[#80e1ff] text-black transition hover:brightness-110 disabled:opacity-40" aria-label={messageState === "signing" ? "Waiting for wallet signature" : "Send message"}><Send size={17} /></button></div></div>
          </> : <div className="flex-1 overflow-y-auto p-5 md:p-7"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-[#b8ff80]">Looking for group</p><h3 className="mt-2 text-2xl font-semibold">Build with people you can verify</h3><p className="mt-2 text-sm text-white/45">Find analysts, builders, creators and moderators for your next Arc project.</p></div><button className="hidden rounded-xl bg-[#b8ff80] px-4 py-2 text-sm font-semibold text-black sm:block">Post an opening</button></div><div className="grid gap-4 xl:grid-cols-2">{LFG_POSTS.filter((post) => post.communityId === communityId || communityId === "arc-builders-tr").map((post) => <article key={post.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-center justify-between text-xs text-white/35"><span>{post.language} · {post.spots} spots</span><span>by {post.author}</span></div><h4 className="mt-4 text-lg font-semibold">{post.title}</h4><p className="mt-2 min-h-12 text-sm leading-6 text-white/50">{post.description}</p><div className="mt-4 flex flex-wrap gap-2">{post.roles.map((role) => <span key={role} className="rounded-full border border-[#b8ff80]/20 bg-[#b8ff80]/5 px-3 py-1 text-xs text-[#b8ff80]">{role}</span>)}</div><button className="mt-5 w-full rounded-xl border border-white/10 py-2.5 text-sm hover:bg-white/5">Request to join</button></article>)}</div></div>}
        </section>

        <aside className="hidden border-l border-white/10 bg-[#080b0a] p-5 lg:block">
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-black text-black" style={{ backgroundColor: community.accent }}>{community.symbol.slice(0, 4)}</span><div><h3 className="flex items-center gap-1.5 font-semibold">{community.name}{community.verified && <BadgeCheck size={15} className="text-[#80e1ff]" />}</h3><p className="text-xs text-white/35">{community.members.toLocaleString()} members · {community.online} online</p></div></div>
          <p className="mt-4 text-sm leading-6 text-white/50">{community.description}</p>
          {community.contract && <button onClick={() => void navigator.clipboard.writeText(community.contract!)} className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left"><span><span className="block text-[9px] uppercase tracking-wider text-white/30">Contract</span><span className="text-xs text-white/60">{shortAddress(community.contract)}</span></span><Copy size={14} /></button>}
          <div className="mt-7"><div className="mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-[#80e1ff]" /><h4 className="text-sm font-semibold">Evidence snapshot</h4></div><div className="space-y-2">{community.riskSignals.map((signal) => <div key={signal.label} className="flex items-center gap-2 rounded-xl bg-white/[0.025] p-3 text-xs text-white/60">{signal.tone === "positive" ? <Check size={14} className="text-[#b8ff80]" /> : <AlertTriangle size={14} className={signal.tone === "danger" ? "text-[#ff7c7c]" : "text-[#ffcc66]"} />}{signal.label}</div>)}</div><p className="mt-3 text-[10px] leading-4 text-white/30">Automated signals are informational and do not constitute financial advice.</p></div>
          <div className="mt-7 rounded-2xl border border-[#80e1ff]/15 bg-gradient-to-br from-[#80e1ff]/10 to-transparent p-4"><Sparkles size={18} className="text-[#80e1ff]" /><h4 className="mt-3 text-sm font-semibold">Start a review room</h4><p className="mt-1 text-xs leading-5 text-white/45">Bring analysts together around contract evidence, not price calls.</p><button className="mt-4 w-full rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black">Create room</button></div>
        </aside>
      </div>

      {tipTarget && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0b0f0e] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-[#b8ff80]">Arc Testnet payment</p><h3 className="mt-2 text-xl font-semibold">Tip {tipTarget.author}</h3></div><button onClick={closeTip} className="rounded-lg p-2 text-white/40 hover:bg-white/5"><X size={18} /></button></div>{tipState === "success" ? <div className="py-10 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#b8ff80]/10 text-[#b8ff80]"><Check size={25} /></div><h4 className="mt-4 text-lg font-semibold">Tip confirmed</h4><p className="mt-2 text-sm text-white/45">The ArcScan receipt was posted in the channel.</p><button onClick={closeTip} className="mt-6 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black">Done</button></div> : <><div className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-xs text-white/45">Amount</span><div className="flex rounded-xl border border-white/10 bg-white/[0.03]"><input value={tipAmount} onChange={(event) => { setTipAmount(event.target.value); setTipState("idle"); }} inputMode="decimal" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-lg font-semibold outline-none" /><span className="border-l border-white/10 px-4 py-3 text-sm text-[#b8ff80]">USDC</span></div></label><div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-xs"><div className="flex justify-between py-1 text-white/45"><span>To</span><span className="font-mono text-white/70">{shortAddress(tipTarget.address)}</span></div><div className="flex justify-between py-1 text-white/45"><span>Network</span><span className="text-white/70">Arc Testnet · 5042002</span></div><div className="flex justify-between py-1 text-white/45"><span>Balance</span><span className="text-white/70">{balance === null ? "Connect wallet" : `${balance.toFixed(2)} USDC`}</span></div></div><label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-white/50"><input type="checkbox" checked={tipConfirmed} onChange={(event) => setTipConfirmed(event.target.checked)} className="mt-1" /><span>I checked the recipient, amount and Arc Testnet network. I understand this transaction cannot be reversed.</span></label>{tipError && <p className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-300">{tipError}</p>}</div><button onClick={() => void submitTip()} disabled={!tipConfirmed || tipState === "sending"} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#b8ff80] px-4 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-35"><Wallet size={16} />{tipState === "sending" ? "Waiting for confirmation…" : address ? "Review in MetaMask" : "Connect wallet"}</button></>}</div></div>}
    </main>
  );
}
