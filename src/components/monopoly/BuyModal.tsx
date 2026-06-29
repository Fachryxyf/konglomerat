"use client";

import { useGame } from "@/lib/monopoly/gameStore";
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

interface Props {
  onClose: () => void;
}

export default function BuyModal({ onClose }: Props) {
  const pendingSpaceAction = useGame((s) => s.pendingSpaceAction);
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const buyProperty = useGame((s) => s.buyProperty);
  const declineBuy = useGame((s) => s.declineBuy);

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
            Beli Properti?
          </DialogTitle>
          <DialogDescription>
            {player.name} mendarat di <strong>{space.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Property card preview */}
          <div className="border-2 rounded-lg overflow-hidden shadow-md" style={{ borderColor: colorHex }}>
            <div className="text-white text-center py-1 text-sm font-bold" style={{ backgroundColor: colorHex }}>
              {space.type === "PROPERTY" ? "TITLE DEED" : space.type === "RAILROAD" ? "RAILROAD" : "UTILITY"}
            </div>
            <div className="p-3 bg-white dark:bg-zinc-900">
              <div className="text-center font-bold mb-2 text-sm">{space.name}</div>
              {space.type === "PROPERTY" && (
                <div className="text-xs space-y-0.5 text-zinc-700 dark:text-zinc-300">
                  <div className="flex justify-between"><span>Sewa Dasar:</span><span>${(space as PropertySpace).rent[0]}</span></div>
                  <div className="flex justify-between"><span>dengan 1 Rumah:</span><span>${(space as PropertySpace).rent[1]}</span></div>
                  <div className="flex justify-between"><span>dengan 2 Rumah:</span><span>${(space as PropertySpace).rent[2]}</span></div>
                  <div className="flex justify-between"><span>dengan 3 Rumah:</span><span>${(space as PropertySpace).rent[3]}</span></div>
                  <div className="flex justify-between"><span>dengan 4 Rumah:</span><span>${(space as PropertySpace).rent[4]}</span></div>
                  <div className="flex justify-between font-semibold"><span>dengan HOTEL:</span><span>${(space as PropertySpace).rent[5]}</span></div>
                  <div className="border-t my-1" />
                  <div className="flex justify-between"><span>Harga Rumah:</span><span>${(space as PropertySpace).housePrice}</span></div>
                  <div className="flex justify-between"><span>Harga Gadai:</span><span>${(space as PropertySpace).mortgageValue}</span></div>
                </div>
              )}
              {space.type === "RAILROAD" && (
                <div className="text-xs space-y-0.5 text-zinc-700 dark:text-zinc-300">
                  <div className="flex justify-between"><span>Sewa (1 stasiun):</span><span>$25</span></div>
                  <div className="flex justify-between"><span>Sewa (2 stasiun):</span><span>$50</span></div>
                  <div className="flex justify-between"><span>Sewa (3 stasiun):</span><span>$100</span></div>
                  <div className="flex justify-between"><span>Sewa (4 stasiun):</span><span>$200</span></div>
                  <div className="border-t my-1" />
                  <div className="flex justify-between"><span>Harga Gadai:</span><span>$100</span></div>
                </div>
              )}
              {space.type === "UTILITY" && (
                <div className="text-xs space-y-0.5 text-zinc-700 dark:text-zinc-300">
                  <div>Jika pemilik memiliki 1 utilitas, sewa = 4x angka dadu.</div>
                  <div>Jika pemilik memiliki 2 utilitas, sewa = 10x angka dadu.</div>
                  <div className="border-t my-1" />
                  <div className="flex justify-between"><span>Harga Gadai:</span><span>$75</span></div>
                </div>
              )}
              <div className="border-t-2 mt-2 pt-2 flex justify-between font-bold text-sm">
                <span>Harga Beli:</span>
                <span className="text-emerald-600">${price}</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-center text-muted-foreground">
            Saldo {player.name}: <span className={canAfford ? "font-bold text-emerald-600" : "font-bold text-red-600"}>${player.balance}</span>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                buyProperty();
                onClose();
              }}
              disabled={!canAfford}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Beli (${price})
            </Button>
            <Button
              onClick={() => {
                declineBuy();
                onClose();
              }}
              variant="outline"
              className="flex-1"
            >
              Lelang
            </Button>
          </div>
          {!canAfford && (
            <div className="text-xs text-center text-red-600">
              Saldo tidak cukup. Properti akan dilelang.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
