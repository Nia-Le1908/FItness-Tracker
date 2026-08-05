"use client";

import type { ApiErrorCode } from "@/lib/api/http";
import { useUiFeedback } from "@/lib/ui-feedback";

type FeedbackTone = "success" | "warning" | "error" | "info";

export function friendlyApiMessage(message: string, code?: string, fallback = "Something went wrong.") {
  if (code === "VALIDATION_ERROR") {
    return message;
  }

  if (code === "UNAUTHORIZED") {
    return "Sign in to continue.";
  }

  if (code === "NOT_FOUND") {
    return "We couldn’t find the requested item.";
  }

  return message || fallback;
}

export function useApiFeedback() {
  const { pushNotice, setBanner } = useUiFeedback();

  function notifyApiError(title: string, message: string, code?: ApiErrorCode) {
    const friendly = friendlyApiMessage(message, code, message);
    pushNotice({ title, message: friendly, tone: "error" });
    setBanner({ title, message: friendly, tone: "error" });
    return friendly;
  }

  function notifyApiSuccess(title: string, message: string, tone: FeedbackTone = "success") {
    pushNotice({ title, message, tone });
    setBanner({ title, message, tone });
  }

  return { notifyApiError, notifyApiSuccess, friendlyApiMessage };
}
