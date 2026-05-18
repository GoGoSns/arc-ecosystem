'use client';

type Lang = 'en' | 'tr';

interface Props {
  currentLang: Lang;
  onChange: (lang: Lang) => void;
  compact?: boolean;
}

export default function LanguageToggle({ currentLang, onChange, compact = false }: Props) {
  const buttonClass = compact
    ? 'shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-bold tracking-[0.16em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black'
    : 'shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black';

  return (
    <div
      className="flex max-w-full items-center gap-1 overflow-hidden rounded-full border p-1"
      role="group"
      aria-label="Language selector"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(212, 175, 55,0.15)' }}
    >
      {(['en', 'tr'] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          aria-pressed={currentLang === lang}
          className={buttonClass}
          style={{
            background: currentLang === lang ? 'rgba(212, 175, 55,0.15)' : 'transparent',
            color: currentLang === lang ? '#d4af37' : '#ffffff',
            opacity: currentLang === lang ? 1 : 0.5,
          }}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
