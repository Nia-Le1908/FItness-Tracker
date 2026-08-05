"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  HomeIcon,
  FlameIcon,
  BowlIcon,
  DumbbellIcon,
  TrendingUpIcon,
  BellIcon,
  UserIcon,
  ChevronDownIcon,
  SettingsIcon,
  ChartIcon,
  CardIcon,
  ShieldIcon,
  LogoutIcon
} from "@/components/icons";
import { useLanguage } from "@/lib/i18n";
import { strings, t } from "@/lib/strings";
import { useSupabaseSession } from "@/lib/supabase/use-supabase-session";
import { canAccessAdmin } from "@/lib/admin";
import { cn } from "@/lib/utils";

type NotificationEvent = {
  id: string;
  title: string;
  body: string;
  type: string;
  state: string;
  created_at: string;
};

const coreLinks = [
  { href: "/dashboard", Icon: HomeIcon, labelKey: "dashboard" as const },
  { href: "/macro", Icon: FlameIcon, labelKey: "macro" as const },
  { href: "/meal", Icon: BowlIcon, labelKey: "meal" as const },
  { href: "/workout", Icon: DumbbellIcon, labelKey: "workout" as const },
  { href: "/progress", Icon: TrendingUpIcon, labelKey: "progress" as const }
];

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const { supabase, signedIn } = useSupabaseSession();
  const nav = strings.nav;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!signedIn || !supabase) {
        setNotifications([]);
        setRole(null);
        return;
      }

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const [notificationsResponse, profileResponse] = await Promise.all([
        fetch("/api/notification-events", { headers: { Authorization: `Bearer ${token}` } }),
        supabase.from("users").select("role").single()
      ]);
      const notificationsPayload = (await notificationsResponse.json()) as { data?: { events?: NotificationEvent[] } };
      const profileData = profileResponse.data as { role?: string | null } | null;
      if (active) {
        setNotifications(notificationsPayload.data?.events ?? []);
        setRole(profileData?.role ?? null);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [signedIn, supabase]);

  useEffect(() => {
    if (!menuOpen) return;
    function handler(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target && target.closest("[data-account-menu]")) return;
      setMenuOpen(false);
    }
    function escapeHandler(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("click", handler);
    window.addEventListener("keydown", escapeHandler);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", escapeHandler);
    };
  }, [menuOpen]);

  const unreadCount = useMemo(() => notifications.filter((notification) => notification.state === "queued" || notification.state === "sent").length, [notifications]);
  const canAdmin = canAccessAdmin(role);

  async function handleLogout() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="glass-strong border-b border-border/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="group inline-flex shrink-0 items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-base shadow-glow transition-transform group-hover:scale-110 ease-spring">
              <span className="drop-shadow">⚡</span>
            </span>
            <span className="text-lg font-bold tracking-tight text-gradient">{t(nav.brand, language)}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {coreLinks.map(({ href, Icon, labelKey }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  <span>{t(nav[labelKey], language)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 text-sm">
            <ThemeToggle />
            <LanguageToggle />

            {signedIn && supabase ? (
              <>
                <button
                  type="button"
                  onClick={() => setDrawerOpen((value) => !value)}
                  className="relative grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  aria-label="Notifications"
                >
                  <BellIcon />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {unreadCount}
                    </span>
                  ) : null}
                </button>

                <div className="relative" data-account-menu>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((value) => !value)}
                    className="flex items-center gap-1 rounded-xl border border-border bg-card px-2 py-1.5 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    aria-label="Account menu"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <UserIcon className="size-5" />
                    <ChevronDownIcon className="size-3.5" />
                  </button>

                  {menuOpen ? (
                    <div role="menu" className="absolute right-0 top-11 z-50 w-48 rounded-2xl border border-border glass-strong p-1.5 shadow-card animate-slide-up">
                      <Link href="/analytics" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-card/60 hover:text-foreground" role="menuitem">
                        <ChartIcon className="size-4" />
                        {language === "vi" ? "Phân tích" : "Analytics"}
                      </Link>
                      <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-card/60 hover:text-foreground" role="menuitem">
                        <SettingsIcon className="size-4" />
                        {language === "vi" ? "Cài đặt" : "Settings"}
                      </Link>
                      <Link href="/billing" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-card/60 hover:text-foreground" role="menuitem">
                        <CardIcon className="size-4" />
                        Billing
                      </Link>
                      {canAdmin ? (
                        <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-card/60 hover:text-foreground" role="menuitem">
                          <ShieldIcon className="size-4" />
                          Admin
                        </Link>
                      ) : null}
                      <hr className="my-1.5 border-border" />
                      <button type="button" onClick={() => { handleLogout(); setMenuOpen(false); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-card/60 hover:text-foreground" role="menuitem">
                        <LogoutIcon className="size-4" />
                        {t(nav.logout, language)}
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-xl border border-border bg-card px-3 py-2 text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
                  {t(nav.login, language)}
                </Link>
                <Link href="/signup" className="rounded-xl bg-brand px-3 py-2 font-medium text-primary-foreground shadow-glow transition hover:opacity-95">
                  {t(nav.signup, language)}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {drawerOpen && signedIn && supabase ? <NotificationDrawer notifications={notifications} onClose={() => setDrawerOpen(false)} /> : null}
    </header>
  );
}

function NotificationDrawer({ notifications, onClose }: { notifications: NotificationEvent[]; onClose: () => void }) {
  return (
    <div className="absolute right-4 top-14 w-[min(92vw,24rem)] rounded-3xl border border-border glass-strong p-4 shadow-card animate-slide-up">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-card-foreground">Notifications</h2>
        <button onClick={onClose} className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground">
          Close
        </button>
      </div>
      <div className="mt-4 max-h-[24rem] space-y-3 overflow-y-auto pr-1">
        {notifications.length > 0 ? notifications.slice(0, 8).map((notification) => <NotificationItem key={notification.id} notification={notification} />) : <p className="text-sm text-muted-foreground">No notifications yet.</p>}
      </div>
    </div>
  );
}

function NotificationItem({ notification }: { notification: NotificationEvent }) {
  return (
    <div className="rounded-2xl border border-border bg-background/55 p-3 transition hover:border-primary/40">
      <p className="text-sm font-semibold text-card-foreground">{notification.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{notification.type} · {notification.state}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">{notification.body}</p>
    </div>
  );
}
