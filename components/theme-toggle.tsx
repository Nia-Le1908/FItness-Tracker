"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_THEME,
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
  getThemeOption,
  isThemeId,
  type ThemeId
} from "@/lib/theme";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  mounted: boolean;
};

const listeners = new Set<(theme: ThemeId) => void>();

function readStoredTheme(): ThemeId {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr && isThemeId(attr)) return attr;
  return DEFAULT_THEME;
}

function readStoredThemeClient(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && isThemeId(stored)) return stored;
    if (stored === "dark") return "midnight";
  } catch {
  }
  return readStoredTheme();
}

function applyTheme(theme: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
    }
  }
  listeners.forEach((listener) => listener(theme));
}

export function useTheme(): ThemeContextValue {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(readStoredThemeClient());
    setMounted(true);
    const listener = (next: ThemeId) => setThemeState(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  return useMemo(() => ({ theme, setTheme, mounted }), [theme, setTheme, mounted]);
}

export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handler(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target && target.closest("[data-theme-picker]")) return;
      setOpen(false);
    }
    function escapeHandler(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("click", handler);
    window.addEventListener("keydown", escapeHandler);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", escapeHandler);
    };
  }, [open]);

  const active = getThemeOption(theme);

  return (
    <div className="relative" data-theme-picker>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-border bg-card text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
        aria-label="Chọn theme"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={active.label.vi}
      >
        <span className="text-base leading-none">{mounted ? active.emoji : "🌙"}</span>
      </button>

      {open && mounted ? (
        <div
          role="listbox"
          className="absolute right-0 top-11 z-50 w-[min(90vw,16rem)] rounded-2xl border border-border glass-strong p-2 shadow-card animate-slide-up"
        >
          {THEME_OPTIONS.map((option) => {
            const selected = option.id === theme;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setTheme(option.id);
                  setOpen(false);
                }}
                className={
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition " +
                  (selected
                    ? "border border-primary/60 bg-primary/15 text-primary"
                    : "border border-transparent text-muted-foreground hover:border-primary/40 hover:bg-card/60 hover:text-foreground")
                }
              >
                <span
                  className="grid h-8 w-8 place-items-center rounded-lg border border-border text-base"
                  style={{ background: option.swatch }}
                  aria-hidden
                >
                  <span className="drop-shadow">{option.emoji}</span>
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="font-medium">{option.label.vi}</span>
                  <span className="text-xs text-muted-foreground">{option.description.vi}</span>
                </span>
                {selected ? <span aria-hidden>✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
