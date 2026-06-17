export type Theme = "light" | "dark" | "system";

const KEY = "rewear-theme";

export function getTheme(): Theme {
  return (localStorage.getItem(KEY) as Theme) || "system";
}

export function resolveDark(theme: Theme): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function applyTheme(theme: Theme) {
  localStorage.setItem(KEY, theme);
  const dark = resolveDark(theme);
  document.documentElement.classList.toggle("dark", dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#16120f" : "#F5F0E8");
}

/** Apply the stored theme on boot and keep "system" in sync with the OS. */
export function initTheme() {
  applyTheme(getTheme());
  window
    .matchMedia?.("(prefers-color-scheme: dark)")
    .addEventListener?.("change", () => {
      if (getTheme() === "system") applyTheme("system");
    });
}
