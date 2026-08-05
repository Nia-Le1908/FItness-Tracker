"use client";

import { useEffect, useMemo, useState } from "react";

interface ChartThemeColors {
  primary: string;
  mutedForeground: string;
  border: string;
  card: string;
  cardForeground: string;
}

const defaultColors: ChartThemeColors = {
  primary: "hsl(280 95% 65%)",
  mutedForeground: "hsl(215 20% 72%)",
  border: "rgba(148,163,184,0.14)",
  card: "hsl(250 40% 11%)",
  cardForeground: "hsl(210 40% 98%)"
};

export function useChartTheme(): ChartThemeColors {
  const [theme, setTheme] = useState<ChartThemeColors>(defaultColors);

  useEffect(() => {
    const root = document.documentElement;
    const style = getComputedStyle(root);

    setTheme({
      primary: `hsl(${style.getPropertyValue("--primary").trim()})`,
      mutedForeground: `hsl(${style.getPropertyValue("--muted-foreground").trim()})`,
      border: `hsla(${style.getPropertyValue("--border").trim()} / 0.14)`,
      card: `hsl(${style.getPropertyValue("--card").trim()})`,
      cardForeground: `hsl(${style.getPropertyValue("--card-foreground").trim()})`
    });
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const root = document.documentElement;
      const style = getComputedStyle(root);

      setTheme({
        primary: `hsl(${style.getPropertyValue("--primary").trim()})`,
        mutedForeground: `hsl(${style.getPropertyValue("--muted-foreground").trim()})`,
        border: `hsla(${style.getPropertyValue("--border").trim()} / 0.14)`,
        card: `hsl(${style.getPropertyValue("--card").trim()})`,
        cardForeground: `hsl(${style.getPropertyValue("--card-foreground").trim()})`
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });

    return () => observer.disconnect();
  }, []);

  const chartColors = useMemo(() => theme, [theme]);

  return chartColors;
}
