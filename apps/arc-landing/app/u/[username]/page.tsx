import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Redis } from '@upstash/redis';
import ProfileClient from './ProfileClient';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} | Arc Profile`,
    description: `View ${username}'s gaming profile and challenges on Arc Ecosystem.`,
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const cleanHandle = username.toLowerCase();

  let profile = null;
  try {
    const redis = Redis.fromEnv();
    profile = await redis.get(`profile:${cleanHandle}`);
  } catch (err) {
    console.error('Redis fetch error:', err);
  }

  if (!profile) {
    notFound();
  }

  // Redis might return a string or an object depending on how it was set
  const profileData = typeof profile === 'string' ? JSON.parse(profile) : profile;

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <ProfileClient profile={profileData} />
    </div>
  );
}
