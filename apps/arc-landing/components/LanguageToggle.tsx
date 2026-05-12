'use client';

type Lang = 'en' | 'tr';

interface Props {
  currentLang: Lang;
  onChange: (lang: Lang) => void;
}

export default function LanguageToggle({ currentLang, onChange }: Props) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl border"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(201,168,76,0.15)' }}
    >
      {(['en', 'tr'] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => onChange(lang)}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
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
