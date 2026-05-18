'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  Clock3,
  Filter,
  PackageSearch,
  Search,
  ShoppingBag,
} from 'lucide-react';
import { HubBadge, HubCard, HubEmptyState, HubMetricCard, hubInputClass, hubLabelClass, hubSelectClass } from '@/components/HubPrimitives';
import {
  formatMarketDateTime,
  formatMarketPrice,
  getMarketOrderStatusLabel,
  getMarketOrderStatusTone,
  type Order,
  type MarketOrderStatus,
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

function StatusBadge({ status }: { status: MarketOrderStatus }) {
  const tone = getMarketOrderStatusTone(status);
  const className =
    tone === 'emerald'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
      : tone === 'red'
        ? 'border-red-500/25 bg-red-500/10 text-red-200'
        : 'border-amber-500/25 bg-amber-500/10 text-amber-200';

  return <HubBadge className={className}>{getMarketOrderStatusLabel(status)}</HubBadge>;
}

function OrderCard({
  order,
  listingTitle,
}: {
  order: Order;
  listingTitle: string;
}) {
  return (
    <HubCard as="article" className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">{order.id}</p>
          <h3 className="mt-2 text-xl font-black uppercase leading-tight text-white">{listingTitle}</h3>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          ['Buyer', order.buyerName],
          ['Amount', formatMarketPrice(order.amountUsd)],
          ['Created', formatMarketDateTime(order.createdAt)],
          ['Listing ID', order.listingId],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">{label}</div>
            <div className="mt-2 text-sm font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs leading-6 text-[#555566]">Order history stays local and updates instantly with the store.</p>
        <Link href={`/market/${order.listingId}`} className="bracket-button shrink-0">
          View Listing <ArrowRight size={15} />
        </Link>
      </div>
    </HubCard>
  );
}

export default function MarketOrdersPage() {
  const listings = useMarketStore((state) => state.listings);
  const orders = useMarketStore((state) => state.orders);
  const hasHydrated = useMarketStore((state) => state.hasHydrated);
  useRevealObserver();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | MarketOrderStatus>('All');

  const listingTitleById = useMemo(() => {
    return new Map(listings.map((listing) => [listing.id, listing.title] as const));
  }, [listings]);

  const summary = useMemo(() => {
    const totalValue = orders.reduce((sum, order) => sum + order.amountUsd, 0);
    return {
      count: orders.length,
      paid: orders.filter((order) => order.status === 'paid').length,
      pending: orders.filter((order) => order.status === 'pending').length,
      totalValue,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...orders]
      .filter((order) => {
        if (statusFilter !== 'All' && order.status !== statusFilter) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const listingTitle = listingTitleById.get(order.listingId) ?? '';
        const haystack = `${order.id} ${order.buyerName} ${listingTitle} ${order.listingId}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [listingTitleById, orders, query, statusFilter]);

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('All');
  };

  if (!hasHydrated) {
    return (
      <section className="section pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl space-y-6">
          <HubMetricCard label="Orders" value={0} icon={ShoppingBag} />
          <HubCard className="p-6 sm:p-8">
            <div className="space-y-4 animate-pulse" aria-hidden="true">
              <div className="h-3 w-32 rounded-full bg-white/10" />
              <div className="h-8 w-48 rounded-full bg-white/10" />
              <div className="h-4 rounded-full bg-white/10" />
              <div className="h-4 rounded-full bg-white/10" />
              <div className="h-4 rounded-full bg-white/10" />
            </div>
          </HubCard>
          <HubCard className="p-6 sm:p-8">
            <div className="space-y-4 animate-pulse" aria-hidden="true">
              <div className="h-3 w-28 rounded-full bg-white/10" />
              <div className="h-8 w-44 rounded-full bg-white/10" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-24 rounded-2xl bg-white/10" />
                <div className="h-24 rounded-2xl bg-white/10" />
              </div>
            </div>
          </HubCard>
        </div>
      </section>
    );
  }

  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="reveal space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/market" className="inline-flex items-center gap-2 rounded-full border border-[#1a1a2e] bg-white/[0.02] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#bdbdbd] transition-colors hover:border-[#d4af37]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60">
              <ArrowLeft size={14} />
              Back to Market
            </Link>
            <HubBadge className="border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]">Orders</HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">Local history</HubBadge>
          </div>

          <h1 className="max-w-5xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-7xl">
            Arc Market Orders
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[#8a8a9a] sm:text-lg">
            A mock order history for paid, pending, and cancelled checkouts. Filter by status or search across
            buyers and listings while staying inside the browser store.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HubMetricCard label="Orders" value={summary.count} icon={ShoppingBag} />
          <HubMetricCard label="Paid" value={summary.paid} icon={BadgeCheck} />
          <HubMetricCard label="Pending" value={summary.pending} icon={Clock3} />
          <HubMetricCard label="Volume" value={formatMarketPrice(summary.totalValue)} icon={CircleDollarSign} />
        </div>

        <HubCard as="section" className="mt-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Filters</p>
              <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Search the order archive</h2>
            </div>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">
              <Filter size={10} className="mr-1 inline-block" aria-hidden="true" />
              {filteredOrders.length} results
            </HubBadge>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div>
              <label htmlFor="market-order-search" className={`mb-2 block ${hubLabelClass}`}>
                Search orders
              </label>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#555566]" aria-hidden="true" />
                <input
                  id="market-order-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search order id, buyer, or listing..."
                  className={`${hubInputClass} w-full !pl-11`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="market-order-status" className={`mb-2 block ${hubLabelClass}`}>
                Status
              </label>
              <select
                id="market-order-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'All' | MarketOrderStatus)}
                className={`${hubSelectClass} w-full`}
              >
                <option value="All">All statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">Arc Pay checkout history</HubBadge>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-[#1a1a2e] bg-white/[0.02] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#bdbdbd] transition-colors hover:border-[#d4af37]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60"
            >
              Clear filters
            </button>
          </div>
        </HubCard>

        {filteredOrders.length === 0 ? (
          <div className="mt-6">
            <HubEmptyState
              icon={PackageSearch}
              title="No orders found"
              description="Try a different status filter or clear the search to bring the archive back."
            >
              <button type="button" onClick={clearFilters} className="primary-button">
                Reset Filters
              </button>
              <Link href="/market" className="secondary-button">
                Back to Market
              </Link>
            </HubEmptyState>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="hidden lg:block">
              <HubCard className="overflow-hidden p-0">
                <div className="grid grid-cols-[1.1fr_1fr_0.8fr_0.8fr_0.7fr_0.8fr] border-b border-[#1a1a2e] px-5 py-4 text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">
                  <span>Order</span>
                  <span>Listing</span>
                  <span>Buyer</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Date</span>
                </div>
                <div className="divide-y divide-[#2a2a2a]">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="grid grid-cols-[1.1fr_1fr_0.8fr_0.8fr_0.7fr_0.8fr] items-center gap-4 px-5 py-4 text-sm"
                    >
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#555566]">{order.id}</div>
                        <div className="mt-2 text-sm font-semibold text-white">{order.buyerName}</div>
                      </div>
                      <Link href={`/market/${order.listingId}`} className="text-sm font-semibold text-[#f5d060] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60">
                        {listingTitleById.get(order.listingId) ?? order.listingId}
                      </Link>
                      <span className="text-[#d8d8d8]">{order.buyerName}</span>
                      <span className="text-white">{formatMarketPrice(order.amountUsd)}</span>
                      <StatusBadge status={order.status} />
                      <span className="text-[#8a8a9a]">{formatMarketDateTime(order.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </HubCard>
            </div>

            <div className="grid gap-6 lg:hidden">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  listingTitle={listingTitleById.get(order.listingId) ?? order.listingId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
