"use client";

import { useEffect } from "react";

type ColorScheme = "light" | "dark";

const COLOR_SCHEME_STORAGE_KEY = "voicetask.colorScheme";

const isColorScheme = (value: unknown): value is ColorScheme => value === "light" || value === "dark";

const applyColorScheme = (colorScheme: ColorScheme) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", colorScheme === "dark");
};

export default function ColorSchemeController() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const localValue = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    if (isColorScheme(localValue)) {
      applyColorScheme(localValue);
    } else {
      applyColorScheme("light");
    }

    const onThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ colorScheme?: unknown }>;
      const next = customEvent.detail?.colorScheme;
      if (!isColorScheme(next)) return;
      applyColorScheme(next);
      localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, next);
    };

    window.addEventListener("voicetask-theme-change", onThemeChange as EventListener);

    fetch("/api/settings", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !isColorScheme(data.colorScheme)) return;
        applyColorScheme(data.colorScheme);
        localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, data.colorScheme);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("voicetask-theme-change", onThemeChange as EventListener);
    };
  }, []);

  return null;
}
