'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import ForumBrowse, { CATEGORY_CONFIG } from '@/components/forum/ForumBrowse';
import { type ForumCategory } from '@/lib/forumStore';

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  if (!(category in CATEGORY_CONFIG)) notFound();
  return <ForumBrowse filterCategory={category as ForumCategory} />;
}
