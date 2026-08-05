import { normalizeObservabilityInput, buildRuntimeErrorEvent, buildApiErrorEvent, buildActionEvent, buildPerformanceEvent } from "@/lib/observability";
import type { ObservabilityInput } from "@/lib/observability";

describe("normalizeObservabilityInput", () => {
  const baseInput: ObservabilityInput = {
    eventType: "page_view",
    severity: "info",
    route: "/dashboard",
    message: "Page loaded"
  };

  it("normalizes a valid input", () => {
    const result = normalizeObservabilityInput(baseInput);
    expect(result.event_type).toBe("page_view");
    expect(result.severity).toBe("info");
    expect(result.route).toBe("/dashboard");
    expect(result.message).toBe("Page loaded");
    expect(result.source).toBe("web");
    expect(result.component).toBeNull();
    expect(result.payload).toEqual({});
    expect(result.session_id).toBeNull();
    expect(result.duration_ms).toBeNull();
  });

  it("defaults invalid severity to 'info'", () => {
    const input = { ...baseInput, severity: "unknown" as any };
    const result = normalizeObservabilityInput(input);
    expect(result.severity).toBe("info");
  });

  it("defaults invalid eventType to 'action'", () => {
    const input = { ...baseInput, eventType: "unknown" as any };
    const result = normalizeObservabilityInput(input);
    expect(result.event_type).toBe("action");
  });

  it("defaults empty route to '/'", () => {
    const input = { ...baseInput, route: "" };
    const result = normalizeObservabilityInput(input);
    expect(result.route).toBe("/");
  });

  it("defaults empty message to 'event'", () => {
    const input = { ...baseInput, message: "" };
    const result = normalizeObservabilityInput(input);
    expect(result.message).toBe("event");
  });

  it("preserves optional fields", () => {
    const input: ObservabilityInput = {
      eventType: "performance",
      severity: "warning",
      route: "/workout",
      component: "SessionTimer",
      message: "Slow render",
      payload: { renderMs: 1200 },
      sessionId: "sess-123",
      durationMs: 1200
    };
    const result = normalizeObservabilityInput(input);
    expect(result.component).toBe("SessionTimer");
    expect(result.payload).toEqual({ renderMs: 1200 });
    expect(result.session_id).toBe("sess-123");
    expect(result.duration_ms).toBe(1200);
  });
});

describe("buildRuntimeErrorEvent", () => {
  it("builds a runtime_error event", () => {
    const event = buildRuntimeErrorEvent("/dashboard", "TypeError: x is not a function");
    expect(event.eventType).toBe("runtime_error");
    expect(event.severity).toBe("error");
    expect(event.route).toBe("/dashboard");
    expect(event.component).toBe("window");
    expect(event.message).toBe("TypeError: x is not a function");
    expect(event.payload).toEqual({});
  });

  it("includes optional payload", () => {
    const event = buildRuntimeErrorEvent("/", "Error", { stack: "trace" });
    expect(event.payload).toEqual({ stack: "trace" });
  });
});

describe("buildApiErrorEvent", () => {
  it("builds an api_error event", () => {
    const event = buildApiErrorEvent("/api/macro", "Validation failed");
    expect(event.eventType).toBe("api_error");
    expect(event.severity).toBe("error");
    expect(event.component).toBe("api");
    expect(event.message).toBe("Validation failed");
  });
});

describe("buildActionEvent", () => {
  it("builds an action event", () => {
    const event = buildActionEvent("/workout", "StartButton", "User clicked start");
    expect(event.eventType).toBe("action");
    expect(event.severity).toBe("info");
    expect(event.component).toBe("StartButton");
    expect(event.message).toBe("User clicked start");
  });
});

describe("buildPerformanceEvent", () => {
  it("uses 'warning' severity when duration > 1000ms", () => {
    const event = buildPerformanceEvent("/dashboard", "Chart", "Slow render", 1500);
    expect(event.eventType).toBe("performance");
    expect(event.severity).toBe("warning");
    expect(event.durationMs).toBe(1500);
  });

  it("uses 'info' severity when duration <= 1000ms", () => {
    const event = buildPerformanceEvent("/dashboard", "Chart", "Fast render", 200);
    expect(event.severity).toBe("info");
  });
});
