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
import { useT } from "@/lib/i18n";

type IconCmp = LucideIcon | ((p: { className?: string }) => ReactElement);

// Icon + color + description key for non-purchasable spaces. Title is the
// localized board name; description is resolved via i18n.
function spaceMeta(space: ReturnType<typeof getSpace>): { Icon: IconCmp; color: string; descKey: string } {
  switch (space.type) {
    case "GO":
      return { Icon: Banknote, color: "#16a34a", descKey: "ui.space.go.desc" };
    case "JAIL":
      return { Icon: JailBarsIcon, color: "#f97316", descKey: "ui.space.jail.desc" };
    case "FREE_PARKING":
      return { Icon: ParkingCircle, color: "#0891b2", descKey: "ui.space.parking.desc" };
    case "GO_TO_JAIL":
      return { Icon: ArrowRightToLine, color: "#dc2626", descKey: "ui.space.gotojail.desc" };
    case "CHANCE":
      return { Icon: HelpCircle, color: "#f97316", descKey: "ui.space.chance.desc" };
    case "COMMUNITY_CHEST":
      return { Icon: Gift, color: "#eab308", descKey: "ui.space.chest.desc" };
    case "TAX": {
      const tax = space as { taxType: "INCOME" | "LUXURY" };
      return tax.taxType === "INCOME"
        ? { Icon: Landmark, color: "#d97706", descKey: "ui.space.incomeTax.desc" }
        : { Icon: Landmark, color: "#d97706", descKey: "ui.space.luxuryTax.desc" };
    }
    default:
      return { Icon: HelpCircle, color: "#6b7280", descKey: "" };
  }
}

// Detail modal: full title-deed card for purchasable spaces, a styled info panel
// for everything else. Shared by the board and the property catalog.
export default function SpaceDetailModal({ index, onClose }: { index: number; onClose: () => void }) {
  const t = useT();
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
            const { Icon, color, descKey } = spaceMeta(space);
            return (
              <div className="rounded-lg overflow-hidden border-2 shadow-xl bg-white dark:bg-zinc-900" style={{ borderColor: color }}>
                <div className="flex flex-col items-center gap-2 py-5 text-white" style={{ backgroundColor: color }}>
                  <Icon className="w-10 h-10" />
                  <div className="font-bold uppercase tracking-wide text-sm">{t(`board.${index}.name`)}</div>
                </div>
                <div className="p-3 text-center text-xs text-zinc-600 dark:text-zinc-300">{descKey ? t(descKey) : t(`board.${index}.name`)}</div>
              </div>
            );
          })()
        )}
        <Button
          onClick={onClose}
          className="w-full mt-2 bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-lg"
        >
          {t("ui.common.close")}
        </Button>
      </div>
    </div>
  );
}
