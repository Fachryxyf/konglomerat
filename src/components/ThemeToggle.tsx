"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

// Segmented light / dark / system switch. Theme is read from localStorage on the
// client, so render the neutral "system" state until mounted to avoid a
// hydration mismatch.
export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const active = mounted ? (theme ?? "system") : "system";

  return (
    <div
      className={cn("inline-flex items-center gap-0.5 rounded-md bg-black/10 dark:bg-white/10 p-0.5", className)}
      role="group"
      aria-label="Theme"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-pressed={active === value}
          title={label}
          className={cn(
            "inline-flex items-center rounded p-1 transition-colors",
            active === value
              ? "bg-white text-emerald-800 shadow-sm dark:bg-emerald-600 dark:text-white"
              : "text-current/70 hover:bg-black/10 dark:hover:bg-white/10",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
