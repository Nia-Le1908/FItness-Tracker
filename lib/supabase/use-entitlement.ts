"use client";

import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/auth-client";
import {
  DEFAULT_ENTITLEMENT,
  normalizeEntitlement,
  type EntitlementState
} from "@/lib/billing";

export function useEntitlement() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [entitlement, setEntitlement] = useState<EntitlementState>(DEFAULT_ENTITLEMENT);
  const [loading, setLoading] = useState(true);

  // NOTE: entitlement is ALWAYS derived from the server (/api/billing/entitlement,
  // which reads billing_entitlements via RLS). localStorage is intentionally not
  // consulted — it is user-writable and was previously used to spoof premium.
  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    // Local const that TS can keep narrowing inside the async closure below.
    const client = supabase;
    let active = true;

    async function syncEntitlement() {
      const { data } = await client.auth.getSession();
      if (!active) {
        return;
      }

      if (!data.session) {
        setEntitlement(DEFAULT_ENTITLEMENT);
        return;
      }

      const response = await fetch("/api/billing/entitlement", {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`
        }
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { data?: Partial<EntitlementState> };
      if (payload.data) {
        setEntitlement(normalizeEntitlement({ ...payload.data, source: "stripe" }));
      }
    }

    syncEntitlement();

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setEntitlement(DEFAULT_ENTITLEMENT);
        return;
      }

      fetch("/api/billing/entitlement", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
        .then(async (response) => {
          if (!response.ok) {
            return;
          }
          const payload = (await response.json()) as { data?: Partial<EntitlementState> };
          if (payload.data) {
            setEntitlement(normalizeEntitlement({ ...payload.data, source: "stripe" }));
          }
        })
        .catch(() => undefined);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return { entitlement, loading };
}
