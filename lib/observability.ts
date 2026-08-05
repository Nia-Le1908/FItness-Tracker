export type ObservabilitySeverity = "debug" | "info" | "warning" | "error" | "critical";
export type ObservabilityEventType = "page_view" | "runtime_error" | "action" | "navigation" | "api_error" | "performance";

export type ObservabilityInput = {
  eventType: ObservabilityEventType;
  severity: ObservabilitySeverity;
  route: string;
  component?: string | null;
  message: string;
  payload?: Record<string, unknown> | null;
  sessionId?: string | null;
  durationMs?: number | null;
};

export type NormalizedObservabilityEvent = {
  event_type: ObservabilityEventType;
  severity: ObservabilitySeverity;
  route: string;
  component: string | null;
  message: string;
  payload: Record<string, unknown>;
  session_id: string | null;
  duration_ms: number | null;
  source: string;
};

export function normalizeObservabilityInput(input: ObservabilityInput): NormalizedObservabilityEvent {
  const severity = input.severity === "debug" || input.severity === "info" || input.severity === "warning" || input.severity === "error" || input.severity === "critical" ? input.severity : "info";
  const eventType = input.eventType === "page_view" || input.eventType === "runtime_error" || input.eventType === "action" || input.eventType === "navigation" || input.eventType === "api_error" || input.eventType === "performance" ? input.eventType : "action";

  return {
    event_type: eventType,
    severity,
    route: input.route || "/",
    component: input.component ?? null,
    message: input.message || "event",
    payload: input.payload ?? {},
    session_id: input.sessionId ?? null,
    duration_ms: input.durationMs ?? null,
    source: "web"
  };
}

export function buildRuntimeErrorEvent(route: string, message: string, payload?: Record<string, unknown>) {
  return {
    eventType: "runtime_error" as const,
    severity: "error" as const,
    route,
    component: "window",
    message,
    payload: payload ?? {}
  };
}

export function buildApiErrorEvent(route: string, message: string, payload?: Record<string, unknown>) {
  return {
    eventType: "api_error" as const,
    severity: "error" as const,
    route,
    component: "api",
    message,
    payload: payload ?? {}
  };
}

export function buildActionEvent(route: string, component: string, message: string, payload?: Record<string, unknown>) {
  return {
    eventType: "action" as const,
    severity: "info" as const,
    route,
    component,
    message,
    payload: payload ?? {}
  };
}

export function buildPerformanceEvent(route: string, component: string, message: string, durationMs: number, payload?: Record<string, unknown>) {
  return {
    eventType: "performance" as const,
    severity: durationMs > 1000 ? ("warning" as const) : ("info" as const),
    route,
    component,
    message,
    durationMs,
    payload: payload ?? {}
  };
}
