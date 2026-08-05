"use client";

import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/auth-client";

export function useSupabaseSession() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setSignedIn(false);
      setLoading(false);
      return;
    }

    // Local const that TS can keep narrowing inside the async closure below.
    // (TS control-flow analysis cannot follow the `supabase` narrowing across
    // the async function boundary because `supabase` is a closure variable.)
    const client = supabase;
    let active = true;

    async function loadSession() {
      const { data } = await client.auth.getSession();
      if (!active) {
        return;
      }

      setSignedIn(Boolean(data.session));
      setLoading(false);
    }

    loadSession();

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return { supabase, signedIn, loading };
}
