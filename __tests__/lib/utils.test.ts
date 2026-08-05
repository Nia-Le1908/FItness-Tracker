import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy classes with a space", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", false, "bar")).toBe("foo bar");
    expect(cn("a", null, "b", undefined, "c")).toBe("a b c");
  });

  it("returns empty string for all falsy values", () => {
    expect(cn(false, null, undefined, "")).toBe("");
  });

  it("handles single class", () => {
    expect(cn("only")).toBe("only");
  });

  it("handles no arguments", () => {
    expect(cn()).toBe("");
  });
});
