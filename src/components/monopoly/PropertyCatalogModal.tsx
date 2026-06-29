"use client";

import { useState, useMemo } from "react";
import { useGame } from "@/lib/monopoly/gameStore";
import { COLOR_SETS, COLOR_HEX } from "@/lib/monopoly/boardData";
import { getSpace, getColorHex } from "@/lib/monopoly/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import PropertyCard from "./PropertyCard";
import SpaceDetailModal from "./SpaceDetailModal";
import { LayoutGrid, List, Check, Star, Lock, Hotel, Home } from "lucide-react";
import { useT } from "@/lib/i18n";

interface Props {
  onClose: () => void;
  initialFilter?: "all" | "available" | "owned";
  initialPlayerId?: number | null;
}

const COLOR_SET_ORDER = ["Brown", "LightBlue", "Pink", "Orange", "Red", "Yellow", "Green", "DarkBlue"] as const;

export default function PropertyCatalogModal({ onClose, initialFilter = "all", initialPlayerId = null }: Props) {
  const t = useT();
  const players = useGame((s) => s.players);
  const ownership = useGame((s) => s.ownership);
  const [filter, setFilter] = useState<"all" | "available" | "owned">(initialFilter);
  const [filterPlayerId, setFilterPlayerId] = useState<number | null>(initialPlayerId);
  const [groupByColor, setGroupByColor] = useState(true);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);

  // All purchasable spaces grouped by color set or type
  const allPurchasable = useMemo(() => {
    const items: { index: number; colorSet: string; type: string }[] = [];
    for (const [colorSet, indices] of Object.entries(COLOR_SETS)) {
      for (const idx of indices) {
        items.push({ index: idx, colorSet, type: "PROPERTY" });
      }
    }
    // Railroads
    for (const idx of [5, 15, 25, 35]) {
      items.push({ index: idx, colorSet: "Railroad", type: "RAILROAD" });
    }
    // Utilities
    for (const idx of [12, 28]) {
      items.push({ index: idx, colorSet: "Utility", type: "UTILITY" });
    }
    return items;
  }, []);

  // Apply filters
  const filtered = useMemo(() => {
    return allPurchasable.filter((item) => {
      const o = ownership[item.index];
      const isAvailable = o?.ownerId === null || o?.ownerId === undefined;
      if (filter === "available" && !isAvailable) return false;
      if (filter === "owned" && isAvailable) return false;
      if (filterPlayerId !== null && o?.ownerId !== filterPlayerId) return false;
      return true;
    });
  }, [allPurchasable, ownership, filter, filterPlayerId]);

  // Group by color set / type
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const item of filtered) {
      const key = item.colorSet;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [filtered]);

  // Group order
  const groupOrder = [...COLOR_SET_ORDER, "Railroad", "Utility"];

  // Stats
  const stats = useMemo(() => {
    let available = 0;
    let owned = 0;
    let mortgaged = 0;
    const byPlayer: Record<number, number> = {};
    for (const item of allPurchasable) {
      const o = ownership[item.index];
      if (o?.ownerId === null || o?.ownerId === undefined) {
        available++;
      } else {
        owned++;
        byPlayer[o.ownerId] = (byPlayer[o.ownerId] || 0) + 1;
        if (o.mortgaged) mortgaged++;
      }
    }
    return { available, owned, mortgaged, byPlayer, total: allPurchasable.length };
  }, [allPurchasable, ownership]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-600" /> {t("ui.catalog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("ui.propcat.desc", { avail: stats.available, owned: stats.owned, mort: stats.mortgaged })}
          </DialogDescription>
        </DialogHeader>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
          {/* Filter status */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className="h-7 text-xs"
            >
              {t("ui.cardcat.all", { n: stats.total })}
            </Button>
            <Button
              size="sm"
              variant={filter === "available" ? "default" : "outline"}
              onClick={() => setFilter("available")}
              className="h-7 text-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1" /> {t("ui.propcat.available", { n: stats.available })}
            </Button>
            <Button
              size="sm"
              variant={filter === "owned" ? "default" : "outline"}
              onClick={() => setFilter("owned")}
              className="h-7 text-xs"
            >
              {t("ui.propcat.owned", { n: stats.owned })}
            </Button>
          </div>

          {/* Filter by player */}
          <div className="flex gap-1 items-center ml-auto">
            <span className="text-[10px] text-muted-foreground">{t("ui.propcat.owner")}</span>
            <Button
              size="sm"
              variant={filterPlayerId === null ? "default" : "outline"}
              onClick={() => setFilterPlayerId(null)}
              className="h-7 text-xs px-2"
            >
              {t("ui.catalog.all")}
            </Button>
            {players.filter((p) => !p.bankrupt).map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant={filterPlayerId === p.id ? "default" : "outline"}
                onClick={() => setFilterPlayerId(filterPlayerId === p.id ? null : p.id)}
                className="h-7 text-xs px-2"
                style={filterPlayerId === p.id ? { backgroundColor: p.color, borderColor: p.color } : {}}
              >
                <span className="mr-0.5">{p.token}</span>
                <span className="hidden sm:inline">{p.name}</span>
                <span className="ml-1 opacity-70">({stats.byPlayer[p.id] || 0})</span>
              </Button>
            ))}
          </div>

          {/* Group toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setGroupByColor(!groupByColor)}
            className="h-7 text-xs"
          >
            {groupByColor ? <><LayoutGrid className="w-3.5 h-3.5 mr-1" /> {t("ui.propcat.groupByColor")}</> : <><List className="w-3.5 h-3.5 mr-1" /> {t("ui.propcat.flatList")}</>}
          </Button>
        </div>

        {/* Property grid */}
        <ScrollArea className="h-[60vh]">
          <div className="p-2 pr-3">
            {filtered.length === 0 ? (
              <div className="text-center text-muted-foreground italic py-12">
                {t("ui.propcat.noMatch")}
              </div>
            ) : groupByColor ? (
              <div className="space-y-4">
                {groupOrder.map((groupKey) => {
                  const items = grouped[groupKey];
                  if (!items || items.length === 0) return null;
                  const colorHex = COLOR_HEX[groupKey] || (groupKey === "Railroad" ? "#1f2937" : "#6b7280");
                  // Check monopoly status
                  const allOwnedBy = items.every((it) => {
                    const o = ownership[it.index];
                    return o?.ownerId !== null && o?.ownerId === ownership[items[0].index]?.ownerId;
                  });
                  const ownerId = ownership[items[0].index]?.ownerId;
                  const isMonopoly = allOwnedBy && ownerId !== null && ownerId !== undefined;
                  return (
                    <div key={groupKey}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: colorHex }} />
                        <div className="text-xs font-bold uppercase tracking-wide">
                          {groupKey === "Railroad" ? t("ui.propcat.railroadGroup") :
                           groupKey === "Utility" ? t("ui.propcat.utilityGroup") :
                           t(`board.color.${groupKey}`)}
                        </div>
                        {isMonopoly && (
                          <div className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-current" /> {t("ui.propcat.monopoly")}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground ml-auto">
                          {t("ui.propcat.nProps", { n: items.length })}
                        </div>
                      </div>
                      <div className={cn(
                        "grid gap-2",
                        groupKey === "Railroad" || groupKey === "Utility" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                      )}>
                        {items.map((item) => (
                          <PropertyCard key={item.index} spaceIndex={item.index} compact onClick={() => setDetailIndex(item.index)} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {filtered.map((item) => (
                  <PropertyCard key={item.index} spaceIndex={item.index} compact onClick={() => setDetailIndex(item.index)} />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer legend */}
        <div className="border-t pt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span>{t("ui.propcat.legend.monopoly")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-red-500" />
              <span>{t("ui.propcat.legend.mortgaged")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Hotel className="w-3 h-3 text-red-600" />
              <span>{t("ui.badge.hotel")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Home className="w-3 h-3 text-emerald-600" />
              <span>{t("ui.badge.house")}</span>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onClose} className="h-7 text-xs">
            {t("ui.common.close")}
          </Button>
        </div>
      </DialogContent>
      {detailIndex !== null && (
        <SpaceDetailModal index={detailIndex} onClose={() => setDetailIndex(null)} />
      )}
    </Dialog>
  );
}
