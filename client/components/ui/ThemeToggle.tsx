"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

const THEMES = ["system", "light", "dark"] as const;
type Theme = (typeof THEMES)[number];

const LABELS: Record<Theme, string> = {
  system: "Tema: Sistema",
  light: "Tema: Claro",
  dark: "Tema: Oscuro",
};

export default function ThemeToggle({ mobile = false }: { mobile?: boolean }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved && THEMES.includes(saved)) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      applyTheme("system");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, mounted]);

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (t === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(isDark ? "dark" : "light");
    } else {
      root.classList.add(t);
    }
  }

  function cycle() {
    setTheme((prev) => {
      const idx = THEMES.indexOf(prev);
      return THEMES[(idx + 1) % THEMES.length];
    });
  }

  // Placeholder invisible para evitar layout shift antes de montar
  if (!mounted) {
    return (
      <div className="h-9 w-full rounded-lg bg-[var(--color-bg-elevated)]/30 animate-pulse" />
    );
  }

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={cycle}
      title={LABELS[theme]}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors w-full border border-transparent hover:border-[var(--color-border)]"
    >
      <Icon className="w-4 h-4 shrink-0 text-[var(--color-primary-text)]" />
      <span className="flex-1 text-left">{LABELS[theme]}</span>
      <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]">
        {theme}
      </span>
    </button>
  );
}
