export type ThemeId =
  | "midnight"
  | "light"
  | "forest"
  | "sunset"
  | "ocean"
  | "rose";

export type ThemeMode = "dark" | "light";

export interface ThemeOption {
  id: ThemeId;
  mode: ThemeMode;
  emoji: string;
  label: { vi: string; en: string };
  description: { vi: string; en: string };
  swatch: string;
}

export const THEME_STORAGE_KEY = "fitbudget-theme";

export const DEFAULT_THEME: ThemeId = "midnight";

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "midnight",
    mode: "dark",
    emoji: "⚡",
    label: { vi: "Midnight", en: "Midnight" },
    description: {
      vi: "Tối đen thép, cam cháy làm điểm nhấn mạnh mẽ.",
      en: "Steel black with fiery amber accents — bold and masculine."
    },
    swatch: "linear-gradient(135deg, hsl(222 35% 6%) 0%, hsl(38 95% 55%) 100%)"
  },
  {
    id: "light",
    mode: "light",
    emoji: "☀️",
    label: { vi: "Sáng", en: "Light" },
    description: {
      vi: "Sáng sạch sẽ, phù hợp ban ngày và mắt nhạy cảm.",
      en: "Clean and bright, great for daylight or sensitive eyes."
    },
    swatch: "linear-gradient(135deg, hsl(240 60% 98%) 0%, hsl(280 85% 55%) 100%)"
  },
  {
    id: "forest",
    mode: "dark",
    emoji: "🌲",
    label: { vi: "Forest", en: "Forest" },
    description: {
      vi: "Xanh rậm rì dịu mắt, giảm mỏi khi dùng lâu.",
      en: "Calm green tones, easy on the eyes for long sessions."
    },
    swatch: "linear-gradient(135deg, hsl(150 35% 8%) 0%, hsl(150 60% 45%) 100%)"
  },
  {
    id: "sunset",
    mode: "dark",
    emoji: "🌅",
    label: { vi: "Sunset", en: "Sunset" },
    description: {
      vi: "Cam-hồng ấm áp, đầy năng lượng khi tập.",
      en: "Warm orange-pink, an energizing vibe for workouts."
    },
    swatch: "linear-gradient(135deg, hsl(20 45% 10%) 0%, hsl(25 95% 60%) 100%)"
  },
  {
    id: "ocean",
    mode: "dark",
    emoji: "🌊",
    label: { vi: "Ocean", en: "Ocean" },
    description: {
      vi: "Xanh dương mát mẻ, tập trung cao độ.",
      en: "Cool blues for a calm, focused mood."
    },
    swatch: "linear-gradient(135deg, hsl(210 50% 8%) 0%, hsl(200 90% 55%) 100%)"
  },
  {
    id: "rose",
    mode: "light",
    emoji: "🌸",
    label: { vi: "Rose", en: "Rose" },
    description: {
      vi: "Hồng pastel nhẹ nhàng, chế độ sáng dịu.",
      en: "Soft pastel rose, a gentle light theme."
    },
    swatch: "linear-gradient(135deg, hsl(350 60% 96%) 0%, hsl(340 85% 70%) 100%)"
  }
];

export const DEFAULT_THEME_OPTION = THEME_OPTIONS.find(
  (option) => option.id === DEFAULT_THEME
) ?? THEME_OPTIONS[0];

export function getThemeOption(id: ThemeId): ThemeOption {
  return THEME_OPTIONS.find((option) => option.id === id) ?? DEFAULT_THEME_OPTION;
}

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return value === "midnight" || value === "light" || value === "forest" || value === "sunset" || value === "ocean" || value === "rose";
}
