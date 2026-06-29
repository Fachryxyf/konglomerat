"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { useLocale, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "id", label: "ID" },
  { value: "en", label: "EN" },
];

// Compact segmented ID | EN switch. Persisted locale is client-only, so defer to
// after mount to avoid a hydration mismatch for EN users.
export default function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale((s) => s.locale);
  const setLocale = useLocale((s) => s.setLocale);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active: Locale = mounted ? locale : "id";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md bg-black/10 dark:bg-white/10 p-0.5",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      <Languages className="w-3.5 h-3.5 mx-1 opacity-70 shrink-0" />
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLocale(opt.value)}
          aria-pressed={active === opt.value}
          className={cn(
            "px-1.5 py-0.5 rounded text-[11px] font-semibold leading-none transition-colors",
            active === opt.value
              ? "bg-white text-emerald-800 shadow-sm dark:bg-emerald-600 dark:text-white"
              : "text-current/80 hover:bg-black/10 dark:hover:bg-white/10",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
