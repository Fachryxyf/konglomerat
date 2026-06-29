"use client";

import { getSpace } from "@/lib/monopoly/utils";
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/monopoly/PropertyCard";
import {
  Banknote, Landmark, HelpCircle, Gift, ParkingCircle, ArrowRightToLine,
  type LucideIcon,
} from "lucide-react";
import { JailBarsIcon } from "./icons";
import type { ReactElement } from "react";

type IconCmp = LucideIcon | ((p: { className?: string }) => ReactElement);

// Icon + blurb for non-purchasable spaces (corners, chance, tax, …).
function spaceMeta(space: ReturnType<typeof getSpace>): { Icon: IconCmp; color: string; title: string; desc: string } {
  switch (space.type) {
    case "GO":
      return { Icon: Banknote, color: "#16a34a", title: "MULAI", desc: "Kumpulkan $200 setiap kali melewati atau mendarat di sini." };
    case "JAIL":
      return { Icon: JailBarsIcon, color: "#f97316", title: "Penjara / Mampir", desc: "Jika hanya lewat, kamu cuma 'mampir' (aman). Jika dipenjara: bayar $50, pakai kartu, atau lempar kembar untuk keluar (maks 3 percobaan)." };
    case "FREE_PARKING":
      return { Icon: ParkingCircle, color: "#0891b2", title: "Parkir Bebas", desc: "Kotak istirahat — tidak ada aksi maupun biaya." };
    case "GO_TO_JAIL":
      return { Icon: ArrowRightToLine, color: "#dc2626", title: "Masuk Penjara", desc: "Langsung ke penjara tanpa melewati MULAI dan tanpa menerima $200." };
    case "CHANCE":
      return { Icon: HelpCircle, color: "#f97316", title: "Kesempatan", desc: "Ambil satu kartu Kesempatan dan jalankan instruksinya." };
    case "COMMUNITY_CHEST":
      return { Icon: Gift, color: "#eab308", title: "Dana Umum", desc: "Ambil satu kartu Dana Umum dan jalankan instruksinya." };
    case "TAX": {
      const t = space as { taxType: "INCOME" | "LUXURY" };
      return t.taxType === "INCOME"
        ? { Icon: Landmark, color: "#d97706", title: "Income Tax", desc: "Bayar $200 atau 10% dari total kekayaan bersih — pilih yang lebih kecil." }
        : { Icon: Landmark, color: "#d97706", title: "Luxury Tax", desc: "Bayar pajak mewah $100 ke bank." };
    }
    default:
      return { Icon: HelpCircle, color: "#6b7280", title: space.name, desc: "" };
  }
}

// Detail modal: full title-deed card for purchasable spaces, a styled info panel
// for everything else. Shared by the board and the property catalog.
export default function SpaceDetailModal({ index, onClose }: { index: number; onClose: () => void }) {
  const space = getSpace(index);
  const isPurchasable = space.type === "PROPERTY" || space.type === "RAILROAD" || space.type === "UTILITY";

  return (
    // pointer-events-auto: this modal can be opened from inside the property
    // catalog (a Radix dialog), which sets pointer-events:none on the rest of the
    // page — without this, the buttons here wouldn't be clickable.
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 pointer-events-auto"
      onClick={onClose}
    >
      <div className="w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
        {isPurchasable ? (
          <PropertyCard spaceIndex={index} />
        ) : (
          (() => {
            const { Icon, color, title, desc } = spaceMeta(space);
            return (
              <div className="rounded-lg overflow-hidden border-2 shadow-xl bg-white dark:bg-zinc-900" style={{ borderColor: color }}>
                <div className="flex flex-col items-center gap-2 py-5 text-white" style={{ backgroundColor: color }}>
                  <Icon className="w-10 h-10" />
                  <div className="font-bold uppercase tracking-wide text-sm">{title}</div>
                </div>
                <div className="p-3 text-center text-xs text-zinc-600 dark:text-zinc-300">{desc || space.name}</div>
              </div>
            );
          })()
        )}
        <Button
          onClick={onClose}
          className="w-full mt-2 bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-lg"
        >
          Tutup
        </Button>
      </div>
    </div>
  );
}
