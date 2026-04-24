"use client";

import * as React from "react";
import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05] flex items-center justify-center text-foreground transition-all">
        <span className="opacity-0"><Sun size={20} weight="bold" /></span>
      </div>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05] flex items-center justify-center text-foreground transition-all active:scale-90 hover:bg-foreground/[0.05]"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun size={18} weight="bold" />
      ) : (
        <Moon size={18} weight="bold" />
      )}
    </button>
  );
}
