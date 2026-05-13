'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';
import { ArrowRight, Gauge, Languages, Pause, Play, Sparkles, Square, Volume2, type LucideIcon } from 'lucide-react';
import { HubBadge, HubCard, hubSelectClass } from '@/components/HubPrimitives';
import { translations, type Lang } from '@/lib/translations';
import {
  type VoiceTourRequestMode,
  type VoiceTourSectionId,
  type VoiceTourSpeed,
  voiceTourNarration,
  useVoiceTourStore,
} from '@/lib/voiceTourStore';

type VoiceTourSection = {
  id: VoiceTourSectionId;
  href?: string;
};

type VoiceTourCopy = {
  title: string;
  subtitle: string;
  start: string;
  play: string;
  pause: string;
  resume: string;
  stop: string;
  listen: string;
  language: string;
  speed: string;
  current: string;
  unsupportedTitle: string;
  unsupportedDescription: string;
  fallbackHint: string;
  sections: Record<VoiceTourSectionId, { label: string; summary: string }>;
};

const voiceLangMap: Record<Lang, string> = {
  en: 'en-US',
  tr: 'tr-TR',
};

const speedOptions: Array<{ value: VoiceTourSpeed; label: string }> = [
  { value: 0.9, label: '0.9x' },
  { value: 1, label: '1.0x' },
  { value: 1.1, label: '1.1x' },
];

function pickVoice(voices: SpeechSynthesisVoice[], language: Lang) {
  const preferredPrefixes = language === 'tr' ? ['tr'] : ['en'];
  const preferred = voices.find((voice) =>
    preferredPrefixes.some((prefix) => voice.lang.toLowerCase().startsWith(prefix)),
  );

  return preferred ?? voices.find((voice) => voice.default) ?? voices[0] ?? null;
}

function VoiceActionButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  active = false,
  ariaLabel,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-45 ${
        active
          ? 'border-[#c9a84c]/55 bg-[#c9a84c]/15 text-[#f8e7b5] shadow-[0_0_0_1px_rgba(201,168,76,0.15)]'
          : 'border-[#2a2a2a] bg-black/35 text-white hover:border-[#c9a84c]/30 hover:bg-white/[0.04]'
      }`}
    >
      <Icon size={14} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export default function VoiceTour({
  sections,
  compact = false,
  defaultLanguage,
  className = '',
}: {
  sections: VoiceTourSection[];
  compact?: boolean;
  defaultLanguage?: Lang;
  className?: string;
}) {
  const supported = useVoiceTourStore((state) => state.supported);
  const language = useVoiceTourStore((state) => state.language);
  const speed = useVoiceTourStore((state) => state.speed);
  const status = useVoiceTourStore((state) => state.status);
  const activeSectionId = useVoiceTourStore((state) => state.activeSectionId);
  const activeSectionIndex = useVoiceTourStore((state) => state.activeSectionIndex);
  const request = useVoiceTourStore((state) => state.request);
  const error = useVoiceTourStore((state) => state.error);
  const setSupported = useVoiceTourStore((state) => state.setSupported);
  const setLanguage = useVoiceTourStore((state) => state.setLanguage);
  const setSpeed = useVoiceTourStore((state) => state.setSpeed);
  const setStatus = useVoiceTourStore((state) => state.setStatus);
  const setActiveSection = useVoiceTourStore((state) => state.setActiveSection);
  const setError = useVoiceTourStore((state) => state.setError);
  const requestTour = useVoiceTourStore((state) => state.requestTour);
  const resetTour = useVoiceTourStore((state) => state.resetTour);

  const copy: VoiceTourCopy = translations[language].voiceTour;
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const resolveCurrentRef = useRef<(() => void) | null>(null);
  const playbackTokenRef = useRef(0);
  const lastHandledRequestIdRef = useRef(request.id);
  const didInitPreferencesRef = useRef(false);

  useEffect(() => {
    const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined';
    setSupported(hasSpeech);
  }, [setSupported]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (didInitPreferencesRef.current) {
      return;
    }

    didInitPreferencesRef.current = true;

    const savedLanguage = localStorage.getItem('arc-voice-tour-language');
    const savedSpeed = localStorage.getItem('arc-voice-tour-speed');
    const siteLanguage = localStorage.getItem('arc-lang');
    const initialLanguage = savedLanguage === 'en' || savedLanguage === 'tr'
      ? savedLanguage
      : language === 'en' && defaultLanguage
        ? defaultLanguage
        : language === 'en' && (siteLanguage === 'tr' || siteLanguage === 'en')
          ? siteLanguage
          : null;

    if (initialLanguage && initialLanguage !== language) {
      setLanguage(initialLanguage);
    }

    if (savedSpeed === '0.9' || savedSpeed === '1' || savedSpeed === '1.1') {
      const parsedSpeed = Number(savedSpeed) as VoiceTourSpeed;
      if (parsedSpeed !== speed) {
        setSpeed(parsedSpeed);
      }
    }
  }, [defaultLanguage, language, setLanguage, setSpeed, speed]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem('arc-voice-tour-language', language);
  }, [language]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem('arc-voice-tour-speed', String(speed));
  }, [speed]);

  useEffect(() => {
    if (!supported || typeof window === 'undefined') {
      return;
    }

    const refreshVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    refreshVoices();
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices);
    };
  }, [supported]);

  const cancelSpeech = useCallback(() => {
    if (supported && typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }

    resolveCurrentRef.current?.();
    resolveCurrentRef.current = null;
  }, [supported]);

  const stopTour = () => {
    playbackTokenRef.current += 1;
    cancelSpeech();
    resetTour();
  };

  const speakText = (text: string, sectionId: VoiceTourSectionId, index: number, sessionToken: number) => {
    return new Promise<void>((resolve) => {
      if (!supported || typeof window === 'undefined') {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceLangMap[language];
      utterance.rate = speed;
      utterance.pitch = 1;

      const voice = pickVoice(voicesRef.current, language);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        if (playbackTokenRef.current === sessionToken) {
          setActiveSection(sectionId, index);
        }
      };

      utterance.onend = () => {
        if (resolveCurrentRef.current === resolve) {
          resolveCurrentRef.current = null;
        }
        resolve();
      };

      utterance.onerror = () => {
        if (resolveCurrentRef.current === resolve) {
          resolveCurrentRef.current = null;
        }
        resolve();
      };

      resolveCurrentRef.current = resolve;
      window.speechSynthesis.speak(utterance);
    });
  };

  const playSections = (mode: VoiceTourRequestMode, requestedSectionId: VoiceTourSectionId | null) => {
    if (!supported) {
      setError(copy.unsupportedDescription);
      setStatus('idle');
      setActiveSection(null, -1);
      return;
    }

    const queue =
      mode === 'section' && requestedSectionId
        ? sections.filter((section) => section.id === requestedSectionId)
        : sections;

    if (queue.length === 0) {
      setStatus('idle');
      setActiveSection(null, -1);
      return;
    }

    playbackTokenRef.current += 1;
    const sessionToken = playbackTokenRef.current;
    cancelSpeech();
    setError(null);
    setStatus('playing');

    void (async () => {
      for (const [index, section] of queue.entries()) {
        if (playbackTokenRef.current !== sessionToken) {
          return;
        }

        const narration = voiceTourNarration[section.id][language];
        await speakText(narration, section.id, index, sessionToken);

        if (playbackTokenRef.current !== sessionToken) {
          return;
        }
      }

      if (playbackTokenRef.current === sessionToken) {
        setStatus('idle');
        setActiveSection(null, -1);
      }
    })().catch(() => {
      if (playbackTokenRef.current === sessionToken) {
        setError(copy.unsupportedDescription);
        setStatus('idle');
        setActiveSection(null, -1);
      }
    });
  };

  useEffect(() => {
    if (request.id === lastHandledRequestIdRef.current) {
      return;
    }

    lastHandledRequestIdRef.current = request.id;
    playSections(request.mode, request.sectionId);

    return () => {
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.id, request.mode, request.sectionId, language, speed, supported, sections]);

  useEffect(() => {
    return () => {
      stopTour();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSection = sections.find((section) => section.id === activeSectionId) ?? null;
  const activeSectionCopy = activeSection ? translations[language].voiceTour.sections[activeSection.id] : null;

  const onPlay = () => requestTour('tour');
  const onPause = () => {
    if (!supported || status !== 'playing') {
      return;
    }

    window.speechSynthesis.pause();
    setStatus('paused');
  };
  const onResume = () => {
    if (!supported || status !== 'paused') {
      return;
    }

    window.speechSynthesis.resume();
    setStatus('playing');
  };
  const onStop = () => {
    stopTour();
  };

  if (!supported) {
    return (
      <HubCard as="section" className={`p-5 sm:p-6 ${className}`.trim()}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className="border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]">{copy.title}</HubBadge>
              <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">{copy.unsupportedTitle}</HubBadge>
            </div>
            <h2 className="mt-3 text-2xl font-black uppercase sm:text-3xl">{copy.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9a9a9a]">{copy.subtitle}</p>
          </div>
          <Volume2 size={22} className="text-[#c9a84c]" aria-hidden="true" />
        </div>

        <div className="mt-5 rounded-2xl border border-[#2a2a2a] bg-black/35 px-4 py-4 text-sm leading-7 text-[#cfcfcf]">
          <p className="font-semibold text-white">{copy.unsupportedTitle}</p>
          <p className="mt-1 text-[#9a9a9a]">{copy.unsupportedDescription}</p>
          <p className="mt-2 text-[#8a8a8a]">{copy.fallbackHint}</p>
        </div>

        <div className={`mt-4 grid gap-3 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2 xl:grid-cols-4'}`.trim()}>
          {sections.map((section) => {
            const sectionCopy = translations[language].voiceTour.sections[section.id];
            return (
              <div
                key={section.id}
                className="rounded-2xl border border-dashed border-[#2a2a2a] bg-black/30 px-4 py-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">{copy.current}</p>
                    <h3 className="mt-1 text-base font-black uppercase text-white">{sectionCopy.label}</h3>
                  </div>
                  {section.href ? (
                    <Link
                      href={section.href}
                      className="inline-flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-white/[0.02] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#bdbdbd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60"
                    >
                      <span>open</span>
                      <ArrowRight size={12} />
                    </Link>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-[#9a9a9a]">{sectionCopy.summary}</p>
              </div>
            );
          })}
        </div>
      </HubCard>
    );
  }

  return (
    <HubCard as="section" className={`p-5 sm:p-6 ${className}`.trim()}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className="border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]">{copy.title}</HubBadge>
            <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">
              {status === 'playing' ? copy.play : status === 'paused' ? copy.pause : copy.start}
            </HubBadge>
          </div>
          <h2 className={`mt-3 font-black uppercase ${compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`.trim()}>
            {copy.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9a9a9a]">{copy.subtitle}</p>
        </div>

        <div className="flex flex-col items-end gap-2 text-right">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-[#777]">
            <Sparkles size={12} className="text-[#c9a84c]" aria-hidden="true" />
            {copy.current}
          </div>
          <div className="max-w-[16rem] text-right text-lg font-black text-[#f4dc9f] sm:text-2xl">
            {activeSectionCopy?.label ?? copy.start}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <VoiceActionButton
          icon={Play}
          label={copy.play}
          onClick={onPlay}
          ariaLabel={copy.play}
          active={status === 'playing' && activeSectionId !== null}
        />
        <VoiceActionButton
          icon={Pause}
          label={copy.pause}
          onClick={onPause}
          ariaLabel={copy.pause}
          disabled={status !== 'playing'}
        />
        <VoiceActionButton
          icon={Play}
          label={copy.resume}
          onClick={onResume}
          ariaLabel={copy.resume}
          disabled={status !== 'paused'}
        />
        <VoiceActionButton
          icon={Square}
          label={copy.stop}
          onClick={onStop}
          ariaLabel={copy.stop}
          disabled={status === 'idle'}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.7fr_0.7fr]">
        <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-[#777]">
            <Languages size={12} className="text-[#c9a84c]" aria-hidden="true" />
            <label htmlFor="voice-tour-language">{copy.language}</label>
          </div>
          <select
            id="voice-tour-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as Lang)}
            aria-label={copy.language}
            className={`${hubSelectClass} mt-3 w-full bg-black/45`}
          >
            <option value="en">EN</option>
            <option value="tr">TR</option>
          </select>
        </div>

        <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-[#777]">
            <Gauge size={12} className="text-[#c9a84c]" aria-hidden="true" />
            <label htmlFor="voice-tour-speed">{copy.speed}</label>
          </div>
          <select
            id="voice-tour-speed"
            value={String(speed)}
            onChange={(event) => setSpeed(Number(event.target.value) as VoiceTourSpeed)}
            aria-label={copy.speed}
            className={`${hubSelectClass} mt-3 w-full bg-black/45`}
          >
            {speedOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-[#2a2a2a] bg-[linear-gradient(135deg,rgba(201,168,76,0.14),rgba(48,209,88,0.08)),rgba(0,0,0,0.32)] px-4 py-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-[#777]">{copy.current}</div>
          <div className="mt-2 text-sm font-semibold text-white">
            {activeSectionCopy?.summary ?? copy.fallbackHint}
          </div>
          <div className="mt-2 text-xs leading-6 text-[#9a9a9a]">
            {status === 'playing'
              ? `${copy.play} · ${activeSectionIndex + 1 > 0 ? `${activeSectionIndex + 1}/${sections.length}` : sections.length} sections`
              : status === 'paused'
                ? `${copy.resume} · ${activeSectionIndex + 1 > 0 ? `${activeSectionIndex + 1}/${sections.length}` : sections.length} sections`
                : copy.fallbackHint}
          </div>
        </div>
      </div>

      {error ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-2xl border border-[#c9a84c]/25 bg-[#c9a84c]/10 px-4 py-3 text-sm leading-7 text-[#f7e8b7]"
        >
          {error}
        </div>
      ) : null}

      <div className={`mt-5 grid gap-3 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2 xl:grid-cols-4'}`.trim()}>
        {sections.map((section, index) => {
          const sectionCopy = translations[language].voiceTour.sections[section.id];
          const isActive = activeSectionId === section.id;

          return (
            <div
              key={section.id}
              className={`rounded-2xl border p-4 text-left transition-all ${
                isActive
                  ? 'border-[#c9a84c]/55 bg-[linear-gradient(135deg,rgba(201,168,76,0.18),rgba(48,209,88,0.08)),rgba(255,255,255,0.03)] shadow-[0_20px_50px_rgba(0,0,0,0.35)]'
                  : 'border-[#2a2a2a] bg-black/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-1 text-lg font-black uppercase text-white">{sectionCopy.label}</h3>
                </div>

                {section.href ? (
                  <Link
                    href={section.href}
                    aria-label={`${copy.start} ${sectionCopy.label}`}
                    className="inline-flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-white/[0.02] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#bdbdbd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60"
                  >
                    <span>open</span>
                    <ArrowRight size={12} />
                  </Link>
                ) : null}
              </div>

              <p className="mt-2 text-sm leading-6 text-[#9a9a9a]">{sectionCopy.summary}</p>

              <button
                type="button"
                onClick={() => requestTour('section', section.id)}
                aria-label={`${copy.listen} ${sectionCopy.label}`}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/25 bg-[#c9a84c]/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-[#f4dc9f] transition-colors hover:bg-[#c9a84c]/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60"
              >
                <Volume2 size={12} aria-hidden="true" />
                {copy.listen}
              </button>
            </div>
          );
        })}
      </div>
    </HubCard>
  );
}
