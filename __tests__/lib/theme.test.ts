import { getThemeOption, isThemeId, THEME_OPTIONS, DEFAULT_THEME, DEFAULT_THEME_OPTION, THEME_STORAGE_KEY } from "@/lib/theme";

describe("THEME_OPTIONS", () => {
  it("has six theme options", () => {
    expect(THEME_OPTIONS).toHaveLength(6);
  });

  it("each option has required fields", () => {
    for (const option of THEME_OPTIONS) {
      expect(option.id).toBeTruthy();
      expect(option.mode === "dark" || option.mode === "light").toBe(true);
      expect(option.label.vi).toBeTruthy();
      expect(option.label.en).toBeTruthy();
      expect(option.description.vi).toBeTruthy();
      expect(option.description.en).toBeTruthy();
      expect(option.swatch).toBeTruthy();
    }
  });
});

describe("DEFAULT_THEME", () => {
  it("is 'midnight'", () => {
    expect(DEFAULT_THEME).toBe("midnight");
  });
});

describe("DEFAULT_THEME_OPTION", () => {
  it("matches the default theme id", () => {
    expect(DEFAULT_THEME_OPTION.id).toBe(DEFAULT_THEME);
  });
});

describe("getThemeOption", () => {
  it("returns the matching theme option by id", () => {
    expect(getThemeOption("midnight").id).toBe("midnight");
    expect(getThemeOption("light").id).toBe("light");
    expect(getThemeOption("forest").id).toBe("forest");
    expect(getThemeOption("sunset").id).toBe("sunset");
    expect(getThemeOption("ocean").id).toBe("ocean");
    expect(getThemeOption("rose").id).toBe("rose");
  });

  it("returns DEFAULT_THEME_OPTION for invalid ids", () => {
    const result = getThemeOption("nonexistent" as any);
    expect(result.id).toBe(DEFAULT_THEME);
  });
});

describe("isThemeId", () => {
  it("returns true for valid theme ids", () => {
    expect(isThemeId("midnight")).toBe(true);
    expect(isThemeId("light")).toBe(true);
    expect(isThemeId("forest")).toBe(true);
    expect(isThemeId("sunset")).toBe(true);
    expect(isThemeId("ocean")).toBe(true);
    expect(isThemeId("rose")).toBe(true);
  });

  it("returns false for invalid values", () => {
    expect(isThemeId("unknown")).toBe(false);
    expect(isThemeId("")).toBe(false);
    expect(isThemeId(null)).toBe(false);
    expect(isThemeId(undefined)).toBe(false);
  });
});

describe("THEME_STORAGE_KEY", () => {
  it("is the expected value", () => {
    expect(THEME_STORAGE_KEY).toBe("fitbudget-theme");
  });
});
