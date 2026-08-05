"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type NoticeTone = "info" | "success" | "warning" | "error";

type Notice = {
  id: string;
  title: string;
  message: string;
  tone: NoticeTone;
};

type FeedbackContextValue = {
  pushNotice: (notice: Omit<Notice, "id">) => void;
  setBanner: (notice: Omit<Notice, "id"> | null) => void;
  clearBanner: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [banner, setBannerState] = useState<Notice | null>(null);
  const [toasts, setToasts] = useState<Notice[]>([]);

  const pushNotice = useCallback((notice: Omit<Notice, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const next = { ...notice, id };
    setToasts((current) => [...current, next].slice(-3));
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const setBanner = useCallback((notice: Omit<Notice, "id"> | null) => {
    if (!notice) {
      setBannerState(null);
      return;
    }
    setBannerState({ ...notice, id: `${Date.now()}` });
  }, []);

  const clearBanner = useCallback(() => setBannerState(null), []);

  const value = useMemo(() => ({ pushNotice, setBanner, clearBanner }), [pushNotice, setBanner, clearBanner]);

  return (
    <FeedbackContext.Provider value={value}>
      {banner ? <InlineBanner notice={banner} onClose={clearBanner} /> : null}
      <div className="fixed right-4 top-4 z-[80] space-y-3">{toasts.map((notice) => <Toast key={notice.id} notice={notice} />)}</div>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useUiFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useUiFeedback must be used within FeedbackProvider");
  }
  return context;
}

function toneClasses(tone: NoticeTone) {
  switch (tone) {
    case "success":
      return "border-primary/30 bg-primary/10 text-primary";
    case "warning":
      return "border-amber-400/30 bg-amber-400/10 text-amber-400";
    case "error":
      return "border-red-400/30 bg-red-400/10 text-red-400";
    default:
      return "border-border bg-card text-card-foreground";
  }
}

function Toast({ notice }: { notice: Notice }) {
  return (
    <div className={`w-[min(92vw,22rem)] rounded-2xl border p-4 shadow-soft ${toneClasses(notice.tone)}`}>
      <p className="text-sm font-semibold">{notice.title}</p>
      <p className="mt-1 text-sm leading-6 opacity-90">{notice.message}</p>
    </div>
  );
}

function InlineBanner({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  return (
    <div className={`sticky top-0 z-[70] border-b px-4 py-3 ${toneClasses(notice.tone)}`}>
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{notice.title}</p>
          <p className="mt-1 text-sm leading-6 opacity-90">{notice.message}</p>
        </div>
        <button onClick={onClose} className="rounded-full border border-current/20 px-2 py-1 text-xs font-medium">
          Close
        </button>
      </div>
    </div>
  );
}
