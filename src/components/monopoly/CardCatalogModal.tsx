"use client";

import { useState, useMemo } from "react";
import { useGame } from "@/lib/monopoly/gameStore";
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS, getCardCategory, CARD_CATEGORY_ICONS, CARD_CATEGORY_COLORS } from "@/lib/monopoly/cardData";
import type { CardCategory } from "@/lib/monopoly/cardData";
import type { GameCard } from "@/lib/monopoly/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Layers, HelpCircle, Gift, Lightbulb, Key } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function CardCatalogModal({ onClose }: Props) {
  const [deckFilter, setDeckFilter] = useState<"all" | "CHANCE" | "COMMUNITY_CHEST">("all");
  const [categoryFilter, setCategoryFilter] = useState<CardCategory | "all">("all");

  const allCards = useMemo(() => {
    return [...CHANCE_CARDS, ...COMMUNITY_CHEST_CARDS].sort((a, b) => {
      if (a.deck !== b.deck) return a.deck === "CHANCE" ? -1 : 1;
      return a.id - b.id;
    });
  }, []);

  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      if (deckFilter !== "all" && card.deck !== deckFilter) return false;
      if (categoryFilter !== "all" && getCardCategory(card) !== categoryFilter) return false;
      return true;
    });
  }, [allCards, deckFilter, categoryFilter]);

  // Stats
  const stats = useMemo(() => {
    const chance = allCards.filter((c) => c.deck === "CHANCE").length;
    const cc = allCards.filter((c) => c.deck === "COMMUNITY_CHEST").length;
    const byCategory: Record<string, number> = {};
    for (const card of allCards) {
      const cat = getCardCategory(card);
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }
    return { chance, cc, total: allCards.length, byCategory };
  }, [allCards]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" /> Katalog Kartu Acara
          </DialogTitle>
          <DialogDescription>
            Lihat semua {stats.total} kartu Kesempatan & Dana Umum • {stats.chance} Kesempatan + {stats.cc} Dana Umum
          </DialogDescription>
        </DialogHeader>

        {/* Filter deck */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={deckFilter === "all" ? "default" : "outline"}
              onClick={() => setDeckFilter("all")}
              className="h-7 text-xs"
            >
              Semua ({stats.total})
            </Button>
            <Button
              size="sm"
              variant={deckFilter === "CHANCE" ? "default" : "outline"}
              onClick={() => setDeckFilter("CHANCE")}
              className="h-7 text-xs"
              style={deckFilter === "CHANCE" ? { backgroundColor: "#ea580c" } : {}}
            >
              <HelpCircle className="w-3.5 h-3.5 mr-1" /> Kesempatan ({stats.chance})
            </Button>
            <Button
              size="sm"
              variant={deckFilter === "COMMUNITY_CHEST" ? "default" : "outline"}
              onClick={() => setDeckFilter("COMMUNITY_CHEST")}
              className="h-7 text-xs"
              style={deckFilter === "COMMUNITY_CHEST" ? { backgroundColor: "#ca8a04" } : {}}
            >
              <Gift className="w-3.5 h-3.5 mr-1" /> Dana Umum ({stats.cc})
            </Button>
          </div>

          {/* Filter kategori */}
          <div className="flex flex-wrap gap-1 ml-auto">
            <Button
              size="sm"
              variant={categoryFilter === "all" ? "default" : "outline"}
              onClick={() => setCategoryFilter("all")}
              className="h-7 text-xs px-2"
            >
              Semua Kategori
            </Button>
            {(Object.keys(CARD_CATEGORY_ICONS) as CardCategory[]).map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={categoryFilter === cat ? "default" : "outline"}
                onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
                className="h-7 text-xs px-2"
                style={categoryFilter === cat ? { backgroundColor: CARD_CATEGORY_COLORS[cat] } : {}}
                title={cat}
              >
                {CARD_CATEGORY_ICONS[cat]} <span className="hidden sm:inline">{cat}</span> ({stats.byCategory[cat] || 0})
              </Button>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        <ScrollArea className="h-[60vh]">
          <div className="p-2 pr-3">
            {filteredCards.length === 0 ? (
              <div className="text-center text-muted-foreground italic py-12">
                Tidak ada kartu yang cocok dengan filter ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredCards.map((card) => (
                  <CardPreview key={`${card.deck}-${card.id}`} card={card} />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t pt-2 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-orange-500" /><span>Kesempatan: kotak oranye di papan</span>
              </div>
              <div className="flex items-center gap-1">
                <Gift className="w-3 h-3 text-amber-500" /><span>Dana Umum: kotak kuning di papan</span>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={onClose} className="h-7 text-xs">
              Tutup
            </Button>
          </div>
          {/* GOOJ card note */}
          <div className="text-[10px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded p-1.5 text-amber-800 dark:text-amber-200 flex gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span><strong className="inline-flex items-center gap-1"><Key className="w-3 h-3" /> Kartu Bebas Penjara (Get Out of Jail Free):</strong> Kartu ini bisa disimpan dan dipakai untuk keluar penjara tanpa bayar $50. Kartu ini juga <strong>bisa diperdagangkan</strong> ke pemain lain lewat menu Trade (klik properti pemain → tab Trade).</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CardPreview({ card }: { card: GameCard }) {
  const isChance = card.deck === "CHANCE";
  const category = getCardCategory(card);
  const bgGradient = isChance
    ? "from-orange-500 to-red-600"
    : "from-yellow-400 to-amber-600";
  const Icon = isChance ? HelpCircle : Gift;
  const title = isChance ? "KESEMPATAN" : "DANA UMUM";

  return (
    <div className={cn("rounded-lg p-3 text-white shadow-md bg-gradient-to-br", bgGradient)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className="w-4 h-4" />
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wide opacity-90">{title}</div>
            <div className="text-[9px] opacity-70">#{card.id}</div>
          </div>
        </div>
        <div
          className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/25 backdrop-blur flex items-center gap-0.5"
          title={category}
        >
          {CARD_CATEGORY_ICONS[category]} {category}
        </div>
      </div>
      <div className="bg-white/20 backdrop-blur rounded-md p-2.5 text-xs font-medium min-h-[50px] flex items-center">
        {card.instruction}
      </div>
    </div>
  );
}
