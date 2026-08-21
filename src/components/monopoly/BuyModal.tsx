"use client";

import { useGame } from "@/lib/monopoly/gameStore";
import { useIntent } from "@/lib/monopoly/use-intent";
import { getSpace, getPrice, getColorHex } from "@/lib/monopoly/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { PropertySpace } from "@/lib/monopoly/types";
import { useT } from "@/lib/i18n";

interface Props {
  onClose: () => void;
}

export default function BuyModal({ onClose }: Props) {
  const t = useT();
  const pendingSpaceAction = useGame((s) => s.pendingSpaceAction);
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const send = useIntent();

  if (pendingSpaceAction === null) return null;
  const space = getSpace(pendingSpaceAction);
  const player = players[currentPlayerIndex];
  const price = getPrice(space);
  const canAfford = player.balance >= price;

  const colorHex = space.type === "PROPERTY" ? getColorHex((space as PropertySpace).colorSet) : space.type === "RAILROAD" ? "#374151" : "#6B7280";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-4 h-6 rounded-sm" style={{ backgroundColor: colorHex }} />
            {t("ui.buy.title")}
          </DialogTitle>
          <DialogDescription>
            {t("ui.buy.landedOn", { name: player.name })} <strong>{t(`board.${pendingSpaceAction}.name`)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Property card preview */}
          <div className="border-2 rounded-lg overflow-hidden shadow-md" style={{ borderColor: colorHex }}>
            <div className="text-white text-center py-1 text-sm font-bold uppercase" style={{ backgroundColor: colorHex }}>
              {t(space.type === "PROPERTY" ? "ui.deed.property" : space.type === "RAILROAD" ? "ui.deed.railroad" : "ui.deed.utility")}
            </div>
            <div className="p-3 bg-white dark:bg-zinc-900">
              <div className="text-center font-bold mb-2 text-sm">{t(`board.${pendingSpaceAction}.name`)}</div>
              {space.type === "PROPERTY" && (
                <div className="text-xs space-y-0.5 text-zinc-700 dark:text-zinc-300">
                  <div className="flex justify-between"><span>{t("ui.rent.base")}:</span><span>${(space as PropertySpace).rent[0]}</span></div>
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex justify-between"><span>{t("ui.rent.withHouses", { n })}</span><span>${(space as PropertySpace).rent[n]}</span></div>
                  ))}
                  <div className="flex justify-between font-semibold"><span>{t("ui.rent.withHotel")}</span><span>${(space as PropertySpace).rent[5]}</span></div>
                  <div className="border-t my-1" />
                  <div className="flex justify-between"><span>{t("ui.buy.housePrice")}</span><span>${(space as PropertySpace).housePrice}</span></div>
                  <div className="flex justify-between"><span>{t("ui.buy.mortgagePrice")}</span><span>${(space as PropertySpace).mortgageValue}</span></div>
                </div>
              )}
              {space.type === "RAILROAD" && (
                <div className="text-xs space-y-0.5 text-zinc-700 dark:text-zinc-300">
                  {[1, 2, 3, 4].map((n, i) => (
                    <div key={n} className="flex justify-between"><span>{t("ui.rent.railroad", { n })}</span><span>${[25, 50, 100, 200][i]}</span></div>
                  ))}
                  <div className="border-t my-1" />
                  <div className="flex justify-between"><span>{t("ui.buy.mortgagePrice")}</span><span>$100</span></div>
                </div>
              )}
              {space.type === "UTILITY" && (
                <div className="text-xs space-y-0.5 text-zinc-700 dark:text-zinc-300">
                  <div>{t("ui.buy.utilOne")}</div>
                  <div>{t("ui.buy.utilTwo")}</div>
                  <div className="border-t my-1" />
                  <div className="flex justify-between"><span>{t("ui.buy.mortgagePrice")}</span><span>$75</span></div>
                </div>
              )}
              <div className="border-t-2 mt-2 pt-2 flex justify-between font-bold text-sm">
                <span>{t("ui.card.buyPrice")}</span>
                <span className="text-emerald-600">${price}</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-center text-muted-foreground">
            {t("ui.buy.balanceOf", { name: player.name })} <span className={canAfford ? "font-bold text-emerald-600" : "font-bold text-red-600"}>${player.balance}</span>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (send({ type: "BUY_PROPERTY" })) onClose();
              }}
              disabled={!canAfford}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {t("ui.buy.buy", { price })}
            </Button>
            <Button
              onClick={() => {
                if (send({ type: "DECLINE_BUY" })) onClose();
              }}
              variant="outline"
              className="flex-1"
            >
              {t("ui.buy.auction")}
            </Button>
          </div>
          {!canAfford && (
            <div className="text-xs text-center text-red-600">
              {t("ui.buy.insufficient")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
