export type ThemeChoice = "light" | "dark" | "system";

const SETTINGS_KEY = "pvault_settings";

export function getStoredTheme(): ThemeChoice {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return "light";
    const parsed = JSON.parse(raw);
    const value = Array.isArray(parsed) ? parsed[0]?.theme : parsed?.theme;
    return value === "dark" || value === "system" ? value : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: ThemeChoice = getStoredTheme()) {
  const root = document.documentElement;
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

/**
 * Applies the saved theme on every page load and keeps "system" in sync with
 * the OS preference. Safe to call once at app startup.
 */
export function initTheme() {
  applyTheme();
  try {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (getStoredTheme() === "system") applyTheme("system");
      });
  } catch {
    /* older browsers */
  }
  window.addEventListener("storage", (e) => {
    if (e.key === SETTINGS_KEY) applyTheme();
  });
}
