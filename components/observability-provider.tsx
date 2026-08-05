"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";

import { useSupabaseSession } from "@/lib/supabase/use-supabase-session";
import { buildActionEvent, buildApiErrorEvent, buildPerformanceEvent, buildRuntimeErrorEvent } from "@/lib/observability";

function postObservability(payload: Record<string, unknown>) {
  fetch("/api/observability/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => undefined);
}

export function ObservabilityProvider() {
  const pathname = usePathname();
  const { supabase } = useSupabaseSession();
  const routeStartRef = useRef<number>(Date.now());
  const lastRouteRef = useRef<string>(pathname);

  const sessionKey = useMemo(() => {
    return `fitbudget-session-${Math.random().toString(36).slice(2, 10)}`;
  }, []);

  useEffect(() => {
    let active = true;

    async function recordPageView() {
      const session = await supabase?.auth.getSession();
      const sessionId = session?.data.session?.user.id;
      if (!active) return;

      postObservability({
        eventType: "page_view",
        severity: "info",
        route: pathname,
        component: "route",
        message: "page view",
        payload: { pathname, sessionKey },
        sessionId
      });
    }

    recordPageView();

    return () => {
      active = false;
    };
  }, [pathname, supabase, sessionKey]);

  useEffect(() => {
    if (lastRouteRef.current !== pathname) {
      const durationMs = Date.now() - routeStartRef.current;
      postObservability(buildPerformanceEvent(lastRouteRef.current, "navigation", "navigation latency", durationMs, { to: pathname, from: lastRouteRef.current }));
      routeStartRef.current = Date.now();
      lastRouteRef.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      postObservability(buildRuntimeErrorEvent(pathname, event.message, { filename: event.filename, lineno: event.lineno, colno: event.colno }));
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
      postObservability(buildRuntimeErrorEvent(pathname, message, { type: "unhandledrejection" }));
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName === "BUTTON" || target.tagName === "A") {
        postObservability(buildActionEvent(pathname, target.tagName.toLowerCase(), "ui action", { text: target.textContent?.slice(0, 80) ?? "" }));
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  return null;
}
