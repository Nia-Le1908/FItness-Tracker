"use client";

import { useLanguage } from "@/lib/i18n";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground transition ease-spring hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
      aria-label={language === "vi" ? "Chuyển sang tiếng Anh" : "Switch to Vietnamese"}
      title={language === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
    >
      {language === "vi" ? "🇻🇳 VI" : "🇬🇧 EN"}
    </button>
  );
}
