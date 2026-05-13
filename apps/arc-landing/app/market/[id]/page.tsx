'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Images,
  MapPin,
  PackageSearch,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { HubBadge, HubCard, HubEmptyState, HubSkeletonCard } from '@/components/HubPrimitives';
import { getArcAppUrl, isExternalUrl } from '@/lib/arcAppLinks';
import {
  formatMarketDate,
  formatMarketDateTime,
  formatMarketPrice,
  getMarketListingStatusLabel,
  type Listing,
  useMarketStore,
} from '@/lib/marketStore';

const arcPayUrl = getArcAppUrl('pay');

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

function RelatedListingCard({ listing }: { listing: Listing }) {
  return (
    <HubCard as="article" className="overflow-hidden">
      <div className="relative h-48">
        <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute left-4 top-4">
          <HubBadge className="border-[#c9a84c]/25 bg-[#c9a84c]/15 text-[#f4dc9f]">Arc Pay Ready</HubBadge>
        </div>
      </div>
      <div className="p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">{listing.category}</p>
        <h3 className="mt-2 text-xl font-black uppercase leading-tight text-white">{listing.title}</h3>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-black text-[#f4dc9f]">{formatMarketPrice(listing.priceUsd)}</div>
            <div className="text-xs uppercase tracking-[0.18em] text-[#8b8b8b]">
              <MapPin size={10} className="mr-1 inline-block" aria-hidden="true" />
              {listing.city}
            </div>
          </div>
          <Link href={`/market/${listing.id}`} className="bracket-button shrink-0">
            View Listing <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </HubCard>
  );
}

export default function MarketListingPage() {
  const params = useParams<{ id?: string | string[] }>();
  const listingId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const listings = useMarketStore((state) => state.listings);
  const hasHydrated = useMarketStore((state) => state.hasHydrated);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  useRevealObserver();

  const listing = useMemo(
    () => listings.find((item) => item.id === listingId) ?? null,
    [listingId, listings],
  );

  const relatedListings = useMemo(() => {
    if (!listing) {
      return [];
    }

    return [...listings]
      .filter((item) => item.id !== listing.id)
      .sort((a, b) => {
        const aScore = (a.category === listing.category ? 2 : 0) + (a.status === 'active' ? 1 : 0);
        const bScore = (b.category === listing.category ? 2 : 0) + (b.status === 'active' ? 1 : 0);
        if (aScore !== bScore) {
          return bScore - aScore;
        }

        return b.createdAt - a.createdAt;
      })
      .slice(0, 3);
  }, [listing, listings]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [listing?.id]);

  if (!hasHydrated) {
    return (
      <section className="section pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl space-y-6">
          <HubSkeletonCard lines={4} className="min-h-[280px]" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <HubSkeletonCard lines={4} className="min-h-[520px]" />
            <HubSkeletonCard lines={5} className="min-h-[520px]" />
          </div>
          <HubSkeletonCard lines={3} className="min-h-[260px]" />
        </div>
      </section>
    );
  }

  if (!listing) {
    return (
      <section className="section pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl">
          <HubEmptyState
            icon={PackageSearch}
            title="Listing not found"
            description="The market store does not contain that listing yet. Go back to the hub or create a new listing in the browser store."
          >
            <Link href="/market" className="primary-button">
              Back to Market
              <ArrowLeft size={15} />
            </Link>
            <Link href="/market/new" className="secondary-button">
              Create Listing
            </Link>
          </HubEmptyState>
        </div>
      </section>
    );
  }

  const mainImage = listing.images[selectedImageIndex] ?? listing.images[0];
  const checkoutLink = arcPayUrl ?? null;
  const checkoutIsExternal = checkoutLink ? isExternalUrl(checkoutLink) : false;
  const isSold = listing.status === 'sold';

  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="reveal space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/market" className="inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-white/[0.02] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#bdbdbd] transition-colors hover:border-[#c9a84c]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60">
              <ArrowLeft size={14} />
              Back to Market
            </Link>
            <HubBadge className="border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]">Arc Pay Ready</HubBadge>
            <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">Protected checkout (demo)</HubBadge>
            <HubBadge
              className={`${
                isSold
                  ? 'border-red-500/25 bg-red-500/10 text-red-200'
                  : 'border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]'
              }`}
            >
              {getMarketListingStatusLabel(listing.status)}
            </HubBadge>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">{listing.category}</p>
              <h1 className="mt-2 max-w-4xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-7xl">
                {listing.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#9a9a9a] sm:text-lg">{listing.description}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-[#f4dc9f] sm:text-5xl">{formatMarketPrice(listing.priceUsd)}</div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8b8b8b]">
                <MapPin size={10} className="mr-1 inline-block" aria-hidden="true" />
                {listing.city} &middot; {listing.condition}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <HubCard as="section" className="overflow-hidden p-0">
              <div className="relative aspect-[4/3] min-h-[360px] bg-black/30">
                <img src={mainImage} alt={listing.title} className="h-full w-full object-cover" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <HubBadge className="border-[#c9a84c]/25 bg-[#c9a84c]/15 text-[#f4dc9f]">Gallery</HubBadge>
                  <HubBadge className="border-[#2a2a2a] bg-black/45 text-[#e8e8e8]">
                    {selectedImageIndex + 1} / {listing.images.length}
                  </HubBadge>
                </div>
              </div>
              <div className="grid gap-3 border-t border-[#2a2a2a] bg-black/20 p-4 sm:grid-cols-3">
                {listing.images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`Show image ${index + 1}`}
                    aria-pressed={selectedImageIndex === index}
                    className={`overflow-hidden rounded-2xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60 ${
                      selectedImageIndex === index
                        ? 'border-[#c9a84c]/50 shadow-[0_0_0_1px_rgba(201,168,76,0.15)]'
                        : 'border-[#2a2a2a] opacity-85 hover:opacity-100'
                    }`}
                  >
                    <img src={image} alt={`${listing.title} preview ${index + 1}`} className="h-24 w-full object-cover" />
                  </button>
                ))}
              </div>
            </HubCard>

            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Listing details</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">All the basics in one place</h2>
                </div>
                <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">
                  Created {formatMarketDate(listing.createdAt)}
                </HubBadge>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'City', value: listing.city },
                  { label: 'Condition', value: listing.condition },
                  { label: 'Category', value: listing.category },
                  { label: 'Status', value: getMarketListingStatusLabel(listing.status) },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">{item.label}</div>
                    <div className="mt-2 text-lg font-black text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-[#777]">
                  <ShieldCheck size={12} className="text-[#c9a84c]" aria-hidden="true" />
                  Demo checkout
                </div>
                <p className="mt-2 text-sm leading-7 text-[#9a9a9a]">
                  {isSold
                    ? 'This listing is marked sold in the local market archive. Checkout stays visible for the demo but is not active.'
                    : 'Protected checkout (demo) keeps the flow local while the configured Arc Pay URL handles the payment handoff.'}
                </p>
              </div>
            </HubCard>
          </div>

          <div className="space-y-6">
            <HubCard as="aside" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Seller panel</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">{listing.sellerName}</h2>
                </div>
                <div className="rounded-2xl border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1 text-[#f4dc9f]">
                    <Star size={12} className="fill-current" aria-hidden="true" />
                    <span className="text-sm font-semibold">{listing.sellerRating.toFixed(1)}</span>
                  </div>
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#f4dc9f]/80">Seller rating</div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  ['Listed', formatMarketDateTime(listing.createdAt)],
                  ['Location', listing.city],
                  ['Checkout', checkoutLink ? 'Arc Pay configured' : 'Arc Pay not configured'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                    <span className="text-sm text-[#777]">{label}</span>
                    <span className="text-sm font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {checkoutLink && !isSold ? (
                  <a
                    href={checkoutLink}
                    target={checkoutIsExternal ? '_blank' : undefined}
                    rel={checkoutIsExternal ? 'noopener noreferrer' : undefined}
                    className="primary-button"
                  >
                    Pay with Arc Pay
                    <ArrowRight size={15} />
                  </a>
                ) : (
                  <span aria-disabled="true" className="primary-button cursor-not-allowed opacity-50">
                    Pay with Arc Pay
                    <ArrowRight size={15} />
                  </span>
                )}
                <Link href="/market/orders" className="secondary-button">
                  View Orders
                </Link>
              </div>

              <div className="mt-5 rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-4">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-[#777]">
                  <BadgeCheck size={12} className="text-[#c9a84c]" aria-hidden="true" />
                  Payment ready
                </div>
                <p className="mt-2 text-sm leading-7 text-[#9a9a9a]">
                  The market keeps checkout links safe by routing through the configured Arc Pay URL instead of a hardcoded local address.
                </p>
              </div>
            </HubCard>

            <HubCard as="aside" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Quick stats</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Marketplace signal</h2>
                </div>
                <Images size={20} className="text-[#c9a84c]" aria-hidden="true" />
              </div>
              <div className="mt-6 space-y-3">
                {[
                  ['Price', formatMarketPrice(listing.priceUsd)],
                  ['Seller', listing.sellerName],
                  ['Category', listing.category],
                  ['State', getMarketListingStatusLabel(listing.status)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                    <span className="text-sm text-[#777]">{label}</span>
                    <span className="text-sm font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </HubCard>
          </div>
        </div>

        <div className="reveal mt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Related listings</p>
              <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">More in the same orbit</h2>
            </div>
            <Link href="/market" className="secondary-button">
              Browse All
            </Link>
          </div>

          {relatedListings.length === 0 ? (
            <div className="mt-6">
              <HubEmptyState
                icon={PackageSearch}
                title="No related listings"
                description="The store does not have any other items to show right now."
              >
                <Link href="/market/new" className="primary-button">
                  Create Listing
                  <ArrowRight size={15} />
                </Link>
              </HubEmptyState>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {relatedListings.map((item) => (
                <RelatedListingCard key={item.id} listing={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
