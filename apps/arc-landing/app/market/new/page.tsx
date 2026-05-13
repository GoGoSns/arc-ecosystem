'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  MapPin,
  Plus,
  Store,
} from 'lucide-react';
import {
  HubBadge,
  HubCard,
  hubInputClass,
  hubSelectClass,
  hubTextareaClass,
} from '@/components/HubPrimitives';
import {
  MARKET_CATEGORIES,
  MARKET_CONDITIONS,
  type Listing,
  useMarketStore,
} from '@/lib/marketStore';

type FormState = {
  title: string;
  priceUsd: string;
  category: (typeof MARKET_CATEGORIES)[number];
  city: string;
  condition: (typeof MARKET_CONDITIONS)[number];
  description: string;
  imageUrl: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  title: '',
  priceUsd: '',
  category: MARKET_CATEGORIES[0],
  city: '',
  condition: MARKET_CONDITIONS[0],
  description: '',
  imageUrl: '',
};

const DEFAULT_PREVIEW_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=80';

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (form.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters.';
  }

  const price = Number(form.priceUsd);
  if (!Number.isFinite(price) || price <= 0) {
    errors.priceUsd = 'Price must be greater than 0.';
  }

  if (!form.city.trim()) {
    errors.city = 'City is required.';
  }

  if (form.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters.';
  }

  if (!form.imageUrl.trim()) {
    errors.imageUrl = 'Image URL is required.';
  }

  return errors;
}

function PreviewCard({ form }: { form: FormState }) {
  const price = Number(form.priceUsd);
  const image = form.imageUrl.trim() || DEFAULT_PREVIEW_IMAGE;

  return (
    <HubCard as="aside" className="overflow-hidden p-0">
      <div className="relative aspect-[4/3] min-h-[300px]">
        <img src={image} alt={form.title || 'Listing preview'} className="h-full w-full object-cover" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <HubBadge className="border-[#c9a84c]/25 bg-[#c9a84c]/15 text-[#f4dc9f]">Preview</HubBadge>
          <HubBadge className="border-[#2a2a2a] bg-black/45 text-[#e8e8e8]">Arc Pay Ready</HubBadge>
        </div>
      </div>
      <div className="space-y-4 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">{form.category}</p>
            <h3 className="mt-2 text-3xl font-black uppercase leading-tight">{form.title || 'Your Listing Title'}</h3>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-[#f4dc9f]">
              {price > 0 ? `$${Math.round(price).toLocaleString('en-US')}` : '$0'}
            </div>
            <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#8b8b8b]">
              <MapPin size={10} className="mr-1 inline-block" aria-hidden="true" />
              {form.city || 'City'}
            </div>
          </div>
        </div>

        <p className="text-sm leading-7 text-[#9a9a9a]">
          {form.description || 'Short summary of the item, service, or collectible you want to list.'}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Condition', form.condition],
            ['Image', form.imageUrl.trim() ? 'Connected' : 'Missing'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">{label}</div>
              <div className="mt-2 text-sm font-semibold text-white">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </HubCard>
  );
}

export default function NewMarketListingPage() {
  const createListing = useMarketStore((state) => state.createListing);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successListing, setSuccessListing] = useState<Listing | null>(null);
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (!toastOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToastOpen(false);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toastOpen]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    const listing = createListing({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      priceUsd: Number(form.priceUsd),
      city: form.city.trim(),
      condition: form.condition,
      imageUrl: form.imageUrl.trim(),
    });

    setSuccessListing(listing);
    setToastOpen(true);
    resetForm();
    setSubmitting(false);

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const createdSummary = useMemo(() => {
    if (!successListing) {
      return null;
    }

    return `${successListing.title} \u00b7 ${successListing.city} \u00b7 $${Math.round(successListing.priceUsd).toLocaleString('en-US')}`;
  }, [successListing]);

  return (
    <section className="section pt-24 sm:pt-28">
      {toastOpen && successListing ? (
        <div className="fixed right-4 top-20 z-[60] w-[min(92vw,24rem)]">
          <div
            role="status"
            aria-live="polite"
            className="rounded-3xl border border-[#c9a84c]/25 bg-[linear-gradient(135deg,rgba(201,168,76,0.18),rgba(48,209,88,0.08)),rgba(0,0,0,0.92)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-0.5 text-[#f4dc9f]" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Listing created</p>
                <p className="mt-1 text-xs leading-6 text-[#cfcfcf]">{createdSummary}</p>
              </div>
              <button
                type="button"
                onClick={() => setToastOpen(false)}
                aria-label="Dismiss success message"
                className="rounded-full border border-[#2a2a2a] bg-white/[0.02] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[#bdbdbd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60"
              >
                Close
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/market/${successListing.id}`} className="primary-button">
                View Listing
                <ArrowRight size={15} />
              </Link>
              <Link href="/market" className="secondary-button">
                Back to Market
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl">
        <div className="reveal space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/market" className="inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-white/[0.02] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#bdbdbd] transition-colors hover:border-[#c9a84c]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60">
              <ArrowLeft size={14} />
              Back to Market
            </Link>
            <HubBadge className="border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]">Create Listing</HubBadge>
            <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">Demo form only</HubBadge>
          </div>

          <h1 className="max-w-5xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-7xl">
            Add a new market listing
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[#9a9a9a] sm:text-lg">
            Create a mock listing, preview it live, and save it to the browser store with no backend calls.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
          <HubCard className="p-0">
            <form className="p-6 sm:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Listing form</p>
                <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Fill in the details</h2>
              </div>
              <HubBadge className="border-[#c9a84c]/25 bg-[#c9a84c]/10 text-[#f4dc9f]">
                <BadgeCheck size={10} className="mr-1 inline-block" aria-hidden="true" />
                Arc Pay Ready
              </HubBadge>
            </div>

            <div className="mt-6 grid gap-5">
              <div>
                <label htmlFor="market-title" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">
                  Title
                </label>
                <input
                  id="market-title"
                  type="text"
                  required
                  value={form.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  className={`${hubInputClass} w-full`}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? 'market-title-error' : undefined}
                  placeholder="Arc Scanner X3"
                />
                {errors.title ? (
                  <p id="market-title-error" className="mt-2 text-xs text-red-300">
                    {errors.title}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="market-price" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">
                    Price USD
                  </label>
                <input
                  id="market-price"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="decimal"
                  required
                  value={form.priceUsd}
                  onChange={(event) => updateField('priceUsd', event.target.value)}
                  className={`${hubInputClass} w-full`}
                  aria-invalid={Boolean(errors.priceUsd)}
                  aria-describedby={errors.priceUsd ? 'market-price-error' : undefined}
                    placeholder="420"
                  />
                  {errors.priceUsd ? (
                    <p id="market-price-error" className="mt-2 text-xs text-red-300">
                      {errors.priceUsd}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="market-category" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">
                    Category
                  </label>
                  <select
                    id="market-category"
                    value={form.category}
                    onChange={(event) => updateField('category', event.target.value as (typeof MARKET_CATEGORIES)[number])}
                    className={`${hubSelectClass} w-full`}
                  >
                    {MARKET_CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="market-city" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">
                    City
                  </label>
                <input
                  id="market-city"
                  type="text"
                  required
                  value={form.city}
                  onChange={(event) => updateField('city', event.target.value)}
                  className={`${hubInputClass} w-full`}
                  aria-invalid={Boolean(errors.city)}
                  aria-describedby={errors.city ? 'market-city-error' : undefined}
                    placeholder="Istanbul"
                  />
                  {errors.city ? (
                    <p id="market-city-error" className="mt-2 text-xs text-red-300">
                      {errors.city}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="market-condition" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">
                    Condition
                  </label>
                  <select
                    id="market-condition"
                    value={form.condition}
                    onChange={(event) => updateField('condition', event.target.value as (typeof MARKET_CONDITIONS)[number])}
                    className={`${hubSelectClass} w-full`}
                  >
                    {MARKET_CONDITIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="market-description" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">
                  Description
                </label>
                <textarea
                  id="market-description"
                  required
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  className={`${hubTextareaClass} w-full`}
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={errors.description ? 'market-description-error' : undefined}
                  placeholder="Describe the item, why it stands out, and what the buyer gets."
                />
                {errors.description ? (
                  <p id="market-description-error" className="mt-2 text-xs text-red-300">
                    {errors.description}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="market-image" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">
                  Image URL
                </label>
                <input
                  id="market-image"
                  type="url"
                  required
                  value={form.imageUrl}
                  onChange={(event) => updateField('imageUrl', event.target.value)}
                  className={`${hubInputClass} w-full`}
                  aria-invalid={Boolean(errors.imageUrl)}
                  aria-describedby={errors.imageUrl ? 'market-image-error' : undefined}
                  placeholder="https://images.unsplash.com/..."
                />
                {errors.imageUrl ? (
                  <p id="market-image-error" className="mt-2 text-xs text-red-300">
                    {errors.imageUrl}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-6 text-[#777]">
                Local persistence only. Your market listing is added to the browser store and available in the market hub.
              </p>
              <button type="submit" disabled={submitting} className="primary-button disabled:cursor-not-allowed disabled:opacity-50">
                <Plus size={15} />
                {submitting ? 'Saving...' : 'Create Listing'}
              </button>
            </div>
            </form>
          </HubCard>

          <div className="space-y-6">
            <PreviewCard form={form} />

            <HubCard as="aside" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Create flow</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">What happens next</h2>
                </div>
                <Store size={20} className="text-[#c9a84c]" aria-hidden="true" />
              </div>
              <div className="mt-6 space-y-3">
                {[
                  'The listing is stored in the local market store.',
                  'A success toast appears with a direct listing link.',
                  'The marketplace hub updates instantly after submission.',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm leading-7 text-[#d8d8d8]">
                    {item}
                  </div>
                ))}
              </div>
            </HubCard>
          </div>
        </div>
      </div>
    </section>
  );
}
