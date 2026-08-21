"use client";

import * as React from "react";

// =============================================================================
// Rəng Teması (Color Theme) Context
// Divar Kağızı seçimindən əldə olunan 8 premium rəng temasını bütün tətbiqə
// `data-color-theme` atributu vasitəsilə tətbiq edir (səhifə yenilənmədən).
// =============================================================================

export const COLOR_THEME_IDS = [
  "default",
  "blue",
  "purple",
  "green",
  "rose",
  "orange",
  "slate",
  "zinc",
] as const;

export type ColorThemeId = (typeof COLOR_THEME_IDS)[number];

const STORAGE_KEY = "app-color-theme";

type ColorThemeContextValue = {
  colorTheme: ColorThemeId;
  setColorTheme: (theme: ColorThemeId) => void;
};

const ColorThemeContext = React.createContext<ColorThemeContextValue | null>(null);

function normalize(value?: string | null): ColorThemeId {
  return (COLOR_THEME_IDS as readonly string[]).includes(value ?? "")
    ? (value as ColorThemeId)
    : "default";
}

function applyToDocument(theme: ColorThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-color-theme", theme);
}

export function ColorThemeProvider({
  children,
  initialColorTheme,
}: {
  children: React.ReactNode;
  initialColorTheme?: string | null;
}) {
  // Server-dən gələn dəyər yoxdursa (qonaq / hələ DB-yə saxlanılmamış hallar),
  // ilkin render zamanı localStorage-dəki əvvəlki seçimi bərpa edirik.
  // Lazy initializer istifadə etməklə effekt daxilində əlavə setState çağırışına
  // ehtiyac qalmır (kaskad render problemi olmur).
  const [colorTheme, setColorThemeState] = React.useState<ColorThemeId>(() => {
    if (initialColorTheme) return normalize(initialColorTheme);
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) return normalize(stored);
    }
    return "default";
  });

  // Rəng teması dəyişəndə (və ilk mount-da) <html> elementinə tətbiq et.
  React.useEffect(() => {
    applyToDocument(colorTheme);
  }, [colorTheme]);

  const setColorTheme = React.useCallback((theme: ColorThemeId) => {
    setColorThemeState(theme);
    applyToDocument(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage əlçatan deyilsə (private mod və s.) səssizcə keç
    }
  }, []);

  const value = React.useMemo(
    () => ({ colorTheme, setColorTheme }),
    [colorTheme, setColorTheme]
  );

  return (
    <ColorThemeContext.Provider value={value}>{children}</ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const ctx = React.useContext(ColorThemeContext);
  if (!ctx) {
    throw new Error("useColorTheme, ColorThemeProvider daxilində istifadə olunmalıdır");
  }
  return ctx;
}
