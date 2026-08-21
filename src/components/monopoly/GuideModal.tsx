"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, X } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { chaptersFor } from "@/lib/guide/chapters";

interface Props {
  onClose: () => void;
}

export default function GuideModal({ onClose }: Props) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const CHAPTERS = chaptersFor(locale);
  const [active, setActive] = useState(CHAPTERS[0].id);
  const chapter = CHAPTERS.find((c) => c.id === active) ?? CHAPTERS[0];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl w-[94vw] h-[84vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <div className="font-bold">{t("ui.guide.title")}</div>
          <button onClick={onClose} className="ml-auto text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Chapter nav */}
          <nav className="w-36 sm:w-48 shrink-0 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
            {CHAPTERS.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-[12px] transition ${
                  active === c.id
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                }`}
              >
                <span className={active === c.id ? "text-white" : "text-emerald-600"}>{c.icon}</span>
                <span className="truncate">{c.title}</span>
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-600">{chapter.icon}</span>
              <h3 className="text-lg font-bold">{chapter.title}</h3>
            </div>
            <div>{chapter.body}</div>
          </div>
        </div>

        <div className="px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <Button variant="outline" className="w-full h-8 text-xs" onClick={onClose}>{t("ui.guide.close")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
