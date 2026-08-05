"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  HomeIcon,
  FlameIcon,
  BowlIcon,
  DumbbellIcon,
  TrendingUpIcon
} from "@/components/icons";
import { useLanguage } from "@/lib/i18n";
import { strings, t } from "@/lib/strings";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", Icon: HomeIcon, labelKey: "dashboard" as const },
  { href: "/macro", Icon: FlameIcon, labelKey: "macro" as const },
  { href: "/meal", Icon: BowlIcon, labelKey: "meal" as const },
  { href: "/workout", Icon: DumbbellIcon, labelKey: "workout" as const },
  { href: "/progress", Icon: TrendingUpIcon, labelKey: "progress" as const }
];

export function BottomNav() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const nav = strings.nav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong border-t border-border/60">
      <div className="flex items-center justify-around px-2 py-1.5">
        {tabs.map(({ href, Icon, labelKey }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-xs font-medium transition",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={active ? "text-primary" : ""} />
              <span>{t(nav[labelKey], language)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
