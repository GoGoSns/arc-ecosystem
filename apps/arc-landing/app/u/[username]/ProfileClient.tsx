'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { HubBadge, HubCard, HubMetricCard } from '@/components/HubPrimitives';
import {
  truncateAddress,
  formatChallengeScore,
  formatChallengeAmount,
  getChallengeGameTitle,
  getChallengeMetric,
  useChallengeStore,
} from '@/lib/challengeStore';
import { Trophy, Wallet, Twitter, ExternalLink, ArrowLeft } from 'lucide-react';

interface Profile {
  handle: string;
  address?: string;
  name: string;
  avatar: string;
  username: string;
}

export default function ProfileClient({ profile: initialProfile }: { profile: Profile }) {
  const [profile, setProfile] = useState(initialProfile);
  const { address, isConnected, connect } = useWallet();
  const [isLinking, setIsLinking] = useState(false);

  const challenges = useChallengeStore((state) => state.challenges);
  const userChallenges = challenges.filter(
    (c) =>
      c.creatorAddress.toLowerCase() === profile.address?.toLowerCase() ||
      c.creatorName?.toLowerCase() === profile.username.toLowerCase(),
  );

  const handleLinkWallet = async () => {
    if (!address) return;
    setIsLinking(true);
    try {
      const res = await fetch('/api/profile/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: profile.username, address }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Failed to link wallet:', err);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/game"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-[#8a8a9a] transition-colors hover:text-[#d4af37]"
        >
          <ArrowLeft size={16} />
          Back to Hub
        </Link>
      </div>

      <HubCard className="p-8 sm:p-10">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
          <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-[#d4af37]/30 sm:h-32 sm:w-32">
            <Image src={profile.avatar} alt={profile.name} fill className="object-cover" />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                {profile.name}
              </h1>
              <HubBadge className="border-[#1d9bf0]/30 bg-[#1d9bf0]/10 text-[#1d9bf0]">
                <Twitter size={10} className="mr-1" />@{profile.username}
              </HubBadge>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-4 sm:justify-start">
              {profile.address ? (
                <div className="flex items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 px-4 py-2">
                  <Wallet size={16} className="text-[#d4af37]" />
                  <span className="font-mono text-sm text-[#f5d060]">
                    {truncateAddress(profile.address)}
                  </span>
                </div>
              ) : (
                <button
                  onClick={isConnected ? handleLinkWallet : connect}
                  disabled={isLinking}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37] bg-[#d4af37]/10 px-4 py-2 text-sm font-black uppercase tracking-wider text-[#d4af37] transition-all hover:bg-[#d4af37] hover:text-black disabled:opacity-50"
                >
                  <Wallet size={16} />
                  {isLinking
                    ? 'Linking...'
                    : isConnected
                    ? 'Link Wallet to Profile'
                    : 'Connect Wallet to Link'}
                </button>
              )}
            </div>

            <p className="mt-6 text-[#8a8a9a]">
              The official Arc profile for {profile.name}. Connect with them on-chain and challenge
              their high scores in the Arc Game Hub.
            </p>
          </div>
        </div>
      </HubCard>

      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-[0.2em] text-[#f5d060]">
            Game Stats
          </h2>
          <HubBadge>{userChallenges.length} Challenges Created</HubBadge>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <HubMetricCard label="Wins" value={0} icon={Trophy} />
          <HubMetricCard
            label="Volume"
            value={`$${userChallenges.reduce((acc, c) => acc + c.usdcAmount, 0)}`}
            icon={ExternalLink}
          />
          <HubMetricCard label="Rank" value="N/A" icon={Twitter} />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-black uppercase tracking-[0.2em] text-[#f5d060]">
          Active Challenges
        </h2>

        <div className="mt-6 grid gap-4">
          {userChallenges.length > 0 ? (
            userChallenges.map((challenge) => {
              const gameTitle = getChallengeGameTitle(challenge.gameType);
              const metric = getChallengeMetric(challenge.gameType);
              return (
                <HubCard key={challenge.id} className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black uppercase text-white">{gameTitle}</span>
                        <HubBadge className="border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]">
                          Active
                        </HubBadge>
                      </div>
                      <p className="mt-2 text-sm text-[#8a8a9a]">
                        Target: {formatChallengeScore(challenge.gameType, challenge.targetScore)}{' '}
                        {metric.label}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-[#8a8a9a]">
                          Prize Pool
                        </div>
                        <div className="text-lg font-black text-[#f5d060]">
                          {formatChallengeAmount(challenge.usdcAmount)}
                        </div>
                      </div>
                      <Link
                        href={`/game/${challenge.gameType}?challenge=${challenge.id}`}
                        className="rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-2 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-[#f5d060]"
                      >
                        Challenge
                      </Link>
                    </div>
                  </div>
                </HubCard>
              );
            })
          ) : (
            <HubCard className="p-12 text-center">
              <p className="text-[#555566]">No active challenges from this user yet.</p>
              <Link
                href="/game"
                className="mt-6 inline-block text-sm font-black uppercase tracking-widest text-[#d4af37] underline underline-offset-4"
              >
                Go to Game Hub
              </Link>
            </HubCard>
          )}
        </div>
      </div>
    </div>
  );
}
