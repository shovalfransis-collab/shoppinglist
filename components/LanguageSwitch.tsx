"use client";

import { dictionaries, useLocale, useT, type Locale } from "@/lib/i18n";

// Shows the OTHER language's own name, in that language, so it's always readable.
export default function LanguageSwitch() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const other: Locale = locale === "en" ? "he" : "en";

  return (
    <button
      type="button"
      onClick={() => setLocale(other)}
      lang={other}
      aria-label={t.switchLanguageLabel}
      className="shrink-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-bold"
    >
      {dictionaries[other].languageName}
    </button>
  );
}
