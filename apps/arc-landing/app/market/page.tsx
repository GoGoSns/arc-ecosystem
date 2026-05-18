'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  LayoutGrid,
  List,
  MapPin,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
} from 'lucide-react';
import {
  HubBadge,
  HubCard,
  HubEmptyState,
  HubMetricCard,
  HubSkeletonCard,
  hubInputClass,
  hubSelectClass,
} from '@/components/HubPrimitives';
import {
  formatMarketDate,
  formatMarketPrice,
  getMarketListingStatusLabel,
  MARKET_CATEGORIES,
  type Listing,
  useMarketStore,
} from '@/lib/marketStore';

function useRevealObserver() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.15 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}

function ListingCard({
  listing,
  layout,
}: {
  listing: Listing;
  layout: 'grid' | 'list';
}) {
  const isSold = listing.status === 'sold';

  return (
    <HubCard
      as="article"
      className={`overflow-hidden ${layout === 'list' ? 'lg:grid lg:grid-cols-[320px_minmax(0,1fr)]' : ''} ${
        isSold ? 'opacity-95' : ''
      }`}
    >
      <div className={`relative ${layout === 'list' ? 'h-64 lg:h-full' : 'h-60'}`}>
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/15 text-[#f5d060]">Arc Pay Ready</HubBadge>
          <HubBadge
            className={`${
              isSold
                ? 'border-red-500/25 bg-red-500/10 text-red-200'
                : 'border-[#1a1a2e] bg-black/45 text-[#e8e8e8]'
            }`}
          >
            {getMarketListingStatusLabel(listing.status)}
          </HubBadge>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">{listing.category}</p>
            <h2 className="mt-2 text-2xl font-black uppercase leading-tight text-white sm:text-3xl">{listing.title}</h2>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-[#f5d060] sm:text-4xl">{formatMarketPrice(listing.priceUsd)}</div>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.22em] text-[#8b8b8b]">
              <MapPin size={10} className="mr-1 inline-block" aria-hidden="true" />
              {listing.city} &middot; {listing.condition}
            </p>
          </div>
        </div>

        <p className="max-w-3xl text-sm leading-7 text-[#8a8a9a]">{listing.description}</p>

        <div className="flex flex-wrap items-center gap-2">
          <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#cfcfcf]">{listing.sellerName}</HubBadge>
          <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">
            <Star size={10} className="mr-1 inline-block fill-current" aria-hidden="true" />
            {listing.sellerRating.toFixed(1)}/5
          </HubBadge>
          <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">{formatMarketDate(listing.createdAt)}</HubBadge>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-6 text-[#555566]">
            Strong checkout path for Arc Pay. Demo listings stay local and update instantly in your browser.
          </p>
          <Link href={`/market/${listing.id}`} className="bracket-button shrink-0">
            View Listing <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </HubCard>
  );
}

export default function MarketPage() {
  const listings = useMarketStore((state) => state.listings);
  const hasHydrated = useMarketStore((state) => state.hasHydrated);
  useRevealObserver();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | (typeof MARKET_CATEGORIES)[number]>('All');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const metrics = useMemo(() => {
    const activeListings = listings.filter((listing) => listing.status === 'active').length;
    const soldListings = listings.filter((listing) => listing.status === 'sold').length;
    const avgPrice =
      listings.length === 0 ? 0 : Math.round(listings.reduce((sum, listing) => sum + listing.priceUsd, 0) / listings.length);
    const cities = new Set(listings.map((listing) => listing.city)).size;

    return { activeListings, soldListings, avgPrice, cities };
  }, [listings]);

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedCity = city.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    return [...listings]
      .filter((listing) => {
        if (normalizedQuery) {
          const haystack = `${listing.title} ${listing.description} ${listing.sellerName} ${listing.city}`.toLowerCase();
          if (!haystack.includes(normalizedQuery)) {
            return false;
          }
        }

        if (category !== 'All' && listing.category !== category) {
          return false;
        }

        if (normalizedCity && !listing.city.toLowerCase().includes(normalizedCity)) {
          return false;
        }

        if (min !== null && Number.isFinite(min) && listing.priceUsd < min) {
          return false;
        }

        if (max !== null && Number.isFinite(max) && listing.priceUsd > max) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'active' ? -1 : 1;
        }

        return b.createdAt - a.createdAt;
      });
  }, [category, city, listings, maxPrice, minPrice, query]);

  const clearFilters = () => {
    setQuery('');
    setCategory('All');
    setCity('');
    setMinPrice('');
    setMaxPrice('');
  };

  if (!hasHydrated) {
    return (
      <section className="section pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl space-y-8">
          <HubSkeletonCard lines={4} className="min-h-[260px]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
          </div>
          <HubSkeletonCard lines={3} className="min-h-[260px]" />
          <div className="grid gap-6 lg:grid-cols-2">
            <HubSkeletonCard lines={3} className="min-h-[300px]" />
            <HubSkeletonCard lines={3} className="min-h-[300px]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="reveal space-y-6" style={{ transitionDelay: '40ms' }}>
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className="border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]">// market v1</HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">Demo store only</HubBadge>
          </div>

          <h1 className="max-w-5xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-7xl">
            Arc Market
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[#8a8a9a] sm:text-lg">
            A premium local marketplace for demo listings, Arc Pay-ready checkout, and fast order tracking.
            Search across categories, filter by city and price, and keep everything inside the browser store.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/market/new" className="primary-button">
              Create Listing
              <ArrowRight size={15} />
            </Link>
            <Link href="/market/orders" className="secondary-button">
              View Orders
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HubMetricCard label="Active Listings" value={metrics.activeListings} icon={ShoppingBag} />
          <HubMetricCard label="Sold Listings" value={metrics.soldListings} icon={SlidersHorizontal} />
          <HubMetricCard label="Average Price" value={formatMarketPrice(metrics.avgPrice)} icon={ArrowRight} />
          <HubMetricCard label="Cities" value={metrics.cities} icon={MapPin} />
        </div>

        <div className="reveal" style={{ transitionDelay: '120ms' }}>
          <HubCard as="section" className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Search & filters</p>
              <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Find a listing fast</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#1a1a2e] bg-black/30 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                aria-label="Grid view"
                className={`rounded-full px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60 ${
                  viewMode === 'grid' ? 'bg-[#d4af37]/15 text-[#f5d060]' : 'text-[#8a8a9a] hover:text-white'
                }`}
              >
                <LayoutGrid size={12} className="mr-1 inline-block" aria-hidden="true" />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                aria-label="List view"
                className={`rounded-full px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60 ${
                  viewMode === 'list' ? 'bg-[#d4af37]/15 text-[#f5d060]' : 'text-[#8a8a9a] hover:text-white'
                }`}
              >
                <List size={12} className="mr-1 inline-block" aria-hidden="true" />
                List
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label htmlFor="market-search" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">
                Search
              </label>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#555566]" aria-hidden="true" />
                <input
                  id="market-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search listings, sellers, cities..."
                  aria-label="Search listings"
                  className={`${hubInputClass} w-full !pl-11`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="market-category" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">
                Category
              </label>
              <select
                id="market-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as 'All' | (typeof MARKET_CATEGORIES)[number])}
                aria-label="Filter by category"
                className={`${hubSelectClass} w-full`}
              >
                <option value="All">All categories</option>
                {MARKET_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="market-city" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">
                City
              </label>
              <input
                id="market-city"
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Istanbul, Berlin..."
                aria-label="Filter by city"
                className={`${hubInputClass} w-full`}
              />
            </div>

            <div>
              <label htmlFor="market-min-price" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">
                Min price
              </label>
              <input
                id="market-min-price"
                type="number"
                min="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="$0"
                aria-label="Minimum price"
                className={`${hubInputClass} w-full`}
              />
            </div>

            <div>
              <label htmlFor="market-max-price" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">
                Max price
              </label>
              <input
                id="market-max-price"
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="$10,000"
                aria-label="Maximum price"
                className={`${hubInputClass} w-full`}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">
                <SlidersHorizontal size={10} className="mr-1 inline-block" aria-hidden="true" />
                {filteredListings.length} results
              </HubBadge>
              <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">Arc Pay Ready checkout</HubBadge>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-[#1a1a2e] bg-white/[0.02] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#bdbdbd] transition-colors hover:border-[#d4af37]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60"
            >
              Clear filters
            </button>
          </div>
          </HubCard>
        </div>

        <div className="reveal" style={{ transitionDelay: '180ms' }}>
          {filteredListings.length === 0 ? (
            <div className="mt-6">
              <HubEmptyState
                icon={ShoppingBag}
                title="No listings found"
                description="Try a broader search or clear the filters to bring the market back into view."
              >
                <Link href="/market/new" className="primary-button">
                  Create Listing
                  <ArrowRight size={15} />
                </Link>
                <button type="button" onClick={clearFilters} className="secondary-button">
                  Reset Filters
                </button>
              </HubEmptyState>
            </div>
          ) : (
            <div className={`mt-6 grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} layout={viewMode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
