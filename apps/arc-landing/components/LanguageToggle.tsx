'use client';

type Lang = 'en' | 'tr';

interface Props {
  currentLang: Lang;
  onChange: (lang: Lang) => void;
}

export default function LanguageToggle({ currentLang, onChange }: Props) {
  return (
    <div
      className="flex items-center gap-1 rounded-xl border p-1"
      role="group"
      aria-label="Language selector"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(201,168,76,0.15)' }}
    >
      {(['en', 'tr'] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          aria-pressed={currentLang === lang}
          className="rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all focus-visible:bg-white/5"
          style={{
            background: currentLang === lang ? 'rgba(201,168,76,0.15)' : 'transparent',
            color: currentLang === lang ? '#c9a84c' : '#ffffff',
            opacity: currentLang === lang ? 1 : 0.5,
          }}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
