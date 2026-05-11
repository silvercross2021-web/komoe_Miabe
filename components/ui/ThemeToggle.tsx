"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  /** "default" = bouton rond flottant, "inline" = juste l'icône */
  variant?: "default" | "inline";
}

export function ThemeToggle({ className, variant = "default" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Évite l'hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      className={cn(
        "relative flex items-center justify-center transition-all duration-300 focus:outline-none",
        variant === "default" && [
          "w-10 h-10 rounded-full",
          "bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20",
          "border border-white/20 dark:border-white/20",
          "backdrop-blur-md",
        ],
        variant === "inline" && [
          "w-9 h-9 rounded-full",
          "bg-muted/50 hover:bg-muted border border-border",
          "text-muted-foreground hover:text-foreground",
        ],
        className
      )}
    >
      {/* Soleil (visible en mode sombre) */}
      <Sun
        className={cn(
          "absolute w-4 h-4 transition-all duration-300",
          isDark
            ? "rotate-0 scale-100 opacity-100 text-yellow-300"
            : "rotate-90 scale-0 opacity-0"
        )}
      />
      {/* Lune (visible en mode clair) */}
      <Moon
        className={cn(
          "absolute w-4 h-4 transition-all duration-300",
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100 text-slate-600"
        )}
      />
    </button>
  );
}
