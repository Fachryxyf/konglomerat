"use client";

import { useState } from "react";
import { useGame, getLiquidatableCash } from "@/lib/monopoly/gameStore";
import { getSpace, getPrice, getColorHex, hasMonopoly, countRailroads } from "@/lib/monopoly/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { PropertySpace } from "@/lib/monopoly/types";
import { Bot, Lock, Key, Star, Hotel, Home, Coins, ArrowLeftRight, ClipboardList } from "lucide-react";

interface Props {
  playerId: number;
  onClose: () => void;
}

export default function PropertyManagerModal({ playerId, onClose }: Props) {
  const players = useGame((s) => s.players);
  const ownership = useGame((s) => s.ownership);
  const buildings = useGame((s) => s.buildings);
  const bank = useGame((s) => s.bank);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const buildHouse = useGame((s) => s.buildHouse);
  const sellHouse = useGame((s) => s.sellHouse);
  const buildHotel = useGame((s) => s.buildHotel);
  const sellHotel = useGame((s) => s.sellHotel);
  const mortgageProperty = useGame((s) => s.mortgageProperty);
  const unmortgageProperty = useGame((s) => s.unmortgageProperty);
  const auctionOwnProperty = useGame((s) => s.auctionOwnProperty);
  const sellToBank = useGame((s) => s.sellToBank);
  const proposeTrade = useGame((s) => s.proposeTrade);

  const player = players[playerId];
  const isOwnTurn = playerId === currentPlayerIndex;
  const isHuman = player?.type === "HUMAN";

  const [tradePartner, setTradePartner] = useState<number | null>(null);
  const [tradeCash, setTradeCash] = useState(0);
  const [tradeProperties, setTradeProperties] = useState<number[]>([]);

  if (!player) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm ring-2 ring-white"
              style={{ backgroundColor: player.color }}
            >
              {player.token}
            </span>
            {player.name}
            {player.type === "AI" && <Bot className="w-4 h-4 text-zinc-500" />}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 flex-wrap">
            <span className="tabular-nums">Saldo: ${player.balance.toLocaleString()} • Properti: {player.properties.length}</span>
            {player.inJail && <span className="inline-flex items-center gap-0.5 text-red-500"><Lock className="w-3 h-3" /> Di Penjara</span>}
            {player.getOutOfJailCards > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                <Key className="w-3 h-3" /> Kartu Bebas Penjara ×{player.getOutOfJailCards}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="properties" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="properties">Properti</TabsTrigger>
            <TabsTrigger value="build">Bangun</TabsTrigger>
            <TabsTrigger value="trade">Trade</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px] pr-2">
              {player.properties.length === 0 ? (
                <div className="text-center text-muted-foreground italic py-8">Belum memiliki properti.</div>
              ) : (
                <div className="space-y-1.5">
                  {player.properties.map((idx) => {
                    const space = getSpace(idx);
                    const o = ownership[idx];
                    const b = buildings[idx];
                    const colorHex = space.type === "PROPERTY" ? getColorHex((space as PropertySpace).colorSet) : "#374151";
                    const mono = space.type === "PROPERTY" && hasMonopoly(useGame.getState(), playerId, idx);
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md border text-sm",
                          o?.mortgaged ? "bg-red-50 dark:bg-red-950/30 border-red-200" : "bg-card",
                        )}
                      >
                        <div className="w-3 h-8 rounded-sm" style={{ backgroundColor: colorHex }} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate flex items-center gap-1">
                            {space.name}
                            {mono && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                            {o?.mortgaged && <span className="text-xs text-red-600">[GADAI]</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${getPrice(space)}
                            {space.type === "PROPERTY" && b && (b.hotel ? " • Hotel" : b.houses > 0 ? ` • ${b.houses} rumah` : "")}
                            {space.type === "RAILROAD" && ` • ${countRailroads(useGame.getState(), playerId)} stasiun dimiliki`}
                          </div>
                        </div>
                        {isOwnTurn && isHuman && (
                          <div className="flex gap-1">
                            {o?.mortgaged ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => unmortgageProperty(idx)}
                                disabled={player.balance < Math.ceil(getMortgageValuePub(space) * 1.1)}
                                className="text-xs h-7"
                              >
                                Lunasi
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => mortgageProperty(idx)}
                                disabled={(b && (b.houses > 0 || b.hotel)) || (space.type === "PROPERTY" && hasColorSetBuildings(useGame.getState(), playerId, (space as PropertySpace).colorSet))}
                                className="text-xs h-7"
                              >
                                Gadai
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { auctionOwnProperty(idx); onClose(); }}
                              disabled={(b && (b.houses > 0 || b.hotel)) || (space.type === "PROPERTY" && hasColorSetBuildings(useGame.getState(), playerId, (space as PropertySpace).colorSet))}
                              className="text-xs h-7"
                              title="Lelang properti ini ke pemain lain (hasil masuk ke kamu)"
                            >
                              Lelang
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sellToBank(idx)}
                              disabled={(b && (b.houses > 0 || b.hotel)) || (space.type === "PROPERTY" && hasColorSetBuildings(useGame.getState(), playerId, (space as PropertySpace).colorSet))}
                              className="text-xs h-7"
                              title={`Jual ke bank (terima $${o?.mortgaged ? 0 : getMortgageValuePub(space)})`}
                            >
                              Jual Bank
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="build" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px] pr-2">
              {!isOwnTurn ? (
                <div className="text-center text-muted-foreground italic py-8">
                  Hanya bisa membangun saat giliranmu sendiri.
                </div>
              ) : !isHuman ? (
                <div className="text-center text-muted-foreground italic py-8">
                  Player AI - building otomatis.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-2 rounded inline-flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium">Bank:</span>
                    <span className="inline-flex items-center gap-0.5"><Home className="w-3 h-3 text-emerald-600" /> {bank.houses} rumah</span>
                    <span className="inline-flex items-center gap-0.5"><Hotel className="w-3 h-3 text-red-600" /> {bank.hotels} hotel tersedia</span>
                  </div>
                  {player.properties.filter((idx) => getSpace(idx).type === "PROPERTY" && hasMonopoly(useGame.getState(), playerId, idx)).length === 0 ? (
                    <div className="text-center text-muted-foreground italic py-4">
                      Belum memiliki monopoli color set apapun.
                    </div>
                  ) : (
                    player.properties
                      .filter((idx) => getSpace(idx).type === "PROPERTY" && hasMonopoly(useGame.getState(), playerId, idx))
                      .map((idx) => {
                        const space = getSpace(idx) as PropertySpace;
                        const o = ownership[idx];
                        const b = buildings[idx];
                        const colorHex = getColorHex(space.colorSet);
                        const currentHouses = b?.houses || 0;
                        const hasHotel = b?.hotel ?? false;
                        return (
                          <div key={idx} className="p-2 rounded-md border">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-3 h-8 rounded-sm" style={{ backgroundColor: colorHex }} />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{space.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  ${space.housePrice}/rumah • Saat ini: {hasHotel ? "Hotel" : `${currentHouses} rumah`}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {/* Build house buttons: +1, +2, +3, +4 based on remaining */}
                              {!hasHotel && currentHouses < 4 && (() => {
                                const maxBuildable = 4 - currentHouses;
                                return (
                                  <>
                                    {Array.from({ length: maxBuildable }).map((_, i) => {
                                      const count = i + 1;
                                      const cost = space.housePrice * count;
                                      const canAfford = player.balance >= cost;
                                      const bankHas = bank.houses >= count;
                                      return (
                                        <Button
                                          key={`build-${count}`}
                                          size="sm"
                                          onClick={() => buildHouse(idx, count)}
                                          disabled={!canAfford || !bankHas}
                                          className="text-[10px] h-6 px-2 bg-emerald-600 hover:bg-emerald-700"
                                          title={`Bangun ${count} rumah ($${cost})`}
                                        >
                                          +{count} ({count === 1 ? "$" : ""}{cost})
                                        </Button>
                                      );
                                    })}
                                    {/* Hotel button when at 4 houses */}
                                    {currentHouses === 4 && (
                                      <Button
                                        size="sm"
                                        onClick={() => buildHotel(idx)}
                                        disabled={player.balance < space.housePrice || bank.hotels === 0}
                                        className="text-[10px] h-6 px-2 bg-red-600 hover:bg-red-700"
                                        title={`Bangun Hotel ($${space.housePrice})`}
                                      >
                                        <Hotel className="w-3 h-3 mr-1" /> Hotel (${space.housePrice})
                                      </Button>
                                    )}
                                  </>
                                );
                              })()}
                              {/* Build hotel button (when at 4 houses) - keep separate for clarity */}
                              {!hasHotel && currentHouses === 4 && (
                                <Button
                                  size="sm"
                                  onClick={() => buildHotel(idx)}
                                  disabled={player.balance < space.housePrice || bank.hotels === 0}
                                  className="text-[10px] h-6 px-2 bg-red-600 hover:bg-red-700"
                                >
                                  <Hotel className="w-3 h-3 mr-1" /> Hotel (${space.housePrice})
                                </Button>
                              )}
                              {/* Sell hotel */}
                              {hasHotel && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => sellHotel(idx)}
                                  className="text-[10px] h-6 px-2"
                                >
                                  - Hotel (+${Math.floor(space.housePrice / 2)})
                                </Button>
                              )}
                              {/* Sell house: -1, -2, etc */}
                              {currentHouses > 0 && !hasHotel && (() => {
                                return (
                                  <>
                                    {Array.from({ length: currentHouses }).map((_, i) => {
                                      const count = i + 1;
                                      const refund = Math.floor(space.housePrice / 2) * count;
                                      return (
                                        <Button
                                          key={`sell-${count}`}
                                          size="sm"
                                          variant="outline"
                                          onClick={() => sellHouse(idx, count)}
                                          className="text-[10px] h-6 px-2 text-red-600 hover:text-red-700"
                                          title={`Jual ${count} rumah (+$${refund})`}
                                        >
                                          -{count} (+${refund})
                                        </Button>
                                      );
                                    })}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="trade" className="flex-1 overflow-hidden">
            <TradeTab playerId={playerId} onClose={onClose} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function getMortgageValuePub(space: { type: string; mortgageValue?: number }): number {
  if (space.type === "PROPERTY" || space.type === "RAILROAD" || space.type === "UTILITY") {
    return (space as { mortgageValue: number }).mortgageValue;
  }
  return 0;
}

function hasColorSetBuildings(state: any, playerId: number, colorSet: string): boolean {
  const COLOR_SETS: Record<string, number[]> = {
    Brown: [1, 3],
    LightBlue: [6, 8, 9],
    Pink: [11, 13, 14],
    Orange: [16, 18, 19],
    Red: [21, 23, 24],
    Yellow: [26, 27, 29],
    Green: [31, 32, 34],
    DarkBlue: [37, 39],
  };
  const indices = COLOR_SETS[colorSet] || [];
  for (const idx of indices) {
    const b = state.buildings[idx];
    if (b && (b.houses > 0 || b.hotel)) return true;
  }
  return false;
}

function TradeTab({ playerId, onClose }: { playerId: number; onClose: () => void }) {
  const players = useGame((s) => s.players);
  const ownership = useGame((s) => s.ownership);
  const proposeTrade = useGame((s) => s.proposeTrade);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);

  const [partnerId, setPartnerId] = useState<number | null>(
    players.find((p) => p.id !== playerId && !p.bankrupt)?.id ?? null,
  );
  const [cashFrom, setCashFrom] = useState(0);
  const [cashTo, setCashTo] = useState(0);
  const [propertiesFrom, setPropertiesFrom] = useState<number[]>([]);
  const [propertiesTo, setPropertiesTo] = useState<number[]>([]);
  const [goojFrom, setGoojFrom] = useState(0);
  const [goojTo, setGoojTo] = useState(0);

  const me = players[playerId];
  const partner = partnerId !== null ? players[partnerId] : null;
  const isMyTurn = playerId === currentPlayerIndex;
  // Most cash each side could actually pay (cash + mortgage + building resale).
  const meMax = getLiquidatableCash(useGame.getState(), playerId);
  const partnerMax = partner ? getLiquidatableCash(useGame.getState(), partner.id) : 0;

  if (!isMyTurn) {
    return <div className="text-center text-muted-foreground italic py-8">Trade hanya bisa dilakukan saat giliranmu sendiri.</div>;
  }

  const handleSubmit = () => {
    if (!partner) return;
    // Cash may exceed current balance — the payer auto-liquidates on accept.
    proposeTrade({
      fromId: playerId,
      toId: partnerId!,
      cashFrom,
      cashTo,
      propertiesFrom,
      propertiesTo,
      goojFrom,
      goojTo,
    });
    setCashFrom(0); setCashTo(0);
    setPropertiesFrom([]); setPropertiesTo([]);
    setGoojFrom(0); setGoojTo(0);
    // Close the manager so the proposer can see the result (AI reply / swap) in
    // the board + event log instead of staring at a modal with no feedback.
    onClose();
  };

  return (
    <div className="space-y-3 h-[400px] overflow-y-auto pr-2">
      <div className="text-[10px] bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded p-1.5 text-muted-foreground">
        <strong>Mau beli properti lawan?</strong> Pilih propertinya di kolom <strong>kanan</strong> (kamu terima), lalu isi bayaranmu di <strong>“Cash yang KAMU bayar”</strong> kolom kiri.
      </div>
      <div>
        <label className="text-xs font-medium">Trade dengan:</label>
        <div className="flex flex-wrap gap-1 mt-1">
          {players.filter((p) => p.id !== playerId && !p.bankrupt).map((p) => (
            <button
              key={p.id}
              onClick={() => setPartnerId(p.id)}
              className={cn(
                "px-2 py-1 rounded-md text-xs border flex items-center gap-1",
                partnerId === p.id ? "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-400" : "border-zinc-300",
              )}
            >
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: p.color }}
              />
              {p.token} {p.name}
              <span className="opacity-60">(${p.balance})</span>
            </button>
          ))}
        </div>
      </div>

      {partner && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {/* From me */}
            <div className="border-2 rounded-md p-2" style={{ borderColor: me.color }}>
              <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: me.color }}
                />
                {me.name} serahkan (kamu BAYAR) ↑
              </div>
              <div className="space-y-1.5">
                <div>
                  <label className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-0.5"><Coins className="w-3 h-3" /> Cash yang KAMU bayar (maks ${meMax.toLocaleString()}):</label>
                  <input
                    type="number"
                    value={cashFrom || ""}
                    placeholder="0"
                    onChange={(e) => setCashFrom(Math.max(0, Math.min(meMax, parseInt(e.target.value) || 0)))}
                    className="w-full px-1.5 py-0.5 text-xs border rounded"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Properti kamu yang dilepas ({propertiesFrom.length} dipilih):</div>
                  <div className="max-h-20 overflow-y-auto space-y-0.5 scrollbar-thin">
                    {me.properties.map((idx) => (
                      <button
                        key={idx}
                        onClick={() => setPropertiesFrom((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx])}
                        className={cn(
                          "w-full text-left text-[10px] px-1.5 py-0.5 rounded border transition",
                          propertiesFrom.includes(idx) ? "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-400 font-medium" : "border-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800",
                        )}
                      >
                        {getSpace(idx).name}
                      </button>
                    ))}
                    {me.properties.length === 0 && <div className="text-[10px] italic text-muted-foreground">Tidak ada properti</div>}
                  </div>
                </div>
                {/* GOOJ card chips */}
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Kartu Bebas Penjara ({me.getOutOfJailCards} dimiliki):</div>
                  {me.getOutOfJailCards > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: me.getOutOfJailCards }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setGoojFrom(goojFrom === i + 1 ? i : i + 1)}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] border transition flex items-center gap-0.5",
                            goojFrom >= i + 1
                              ? "bg-amber-100 dark:bg-amber-950/40 border-amber-400 text-amber-700 dark:text-amber-300 font-semibold"
                              : "border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
                          )}
                          title={`Tawarkan ${i + 1} kartu`}
                        >
                          <Key className="w-2.5 h-2.5" /> {i + 1}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] italic text-muted-foreground">Tidak punya kartu</div>
                  )}
                </div>
              </div>
            </div>

            {/* From partner */}
            <div className="border-2 rounded-md p-2" style={{ borderColor: partner.color }}>
              <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: partner.color }}
                />
                {partner.name} serahkan (kamu TERIMA) ↓
              </div>
              <div className="space-y-1.5">
                <div>
                  <label className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 inline-flex items-center gap-0.5"><Coins className="w-3 h-3" /> Cash yang kamu MINTA dari {partner.name} (maks ${partnerMax.toLocaleString()}):</label>
                  <input
                    type="number"
                    value={cashTo || ""}
                    placeholder="0"
                    onChange={(e) => setCashTo(Math.max(0, Math.min(partnerMax, parseInt(e.target.value) || 0)))}
                    className="w-full px-1.5 py-0.5 text-xs border rounded"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Properti {partner.name} yang kamu minta ({propertiesTo.length} dipilih):</div>
                  <div className="max-h-20 overflow-y-auto space-y-0.5 scrollbar-thin">
                    {partner.properties.map((idx) => (
                      <button
                        key={idx}
                        onClick={() => setPropertiesTo((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx])}
                        className={cn(
                          "w-full text-left text-[10px] px-1.5 py-0.5 rounded border transition",
                          propertiesTo.includes(idx) ? "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-400 font-medium" : "border-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800",
                        )}
                      >
                        {getSpace(idx).name}
                      </button>
                    ))}
                    {partner.properties.length === 0 && <div className="text-[10px] italic text-muted-foreground">Tidak ada properti</div>}
                  </div>
                </div>
                {/* GOOJ card chips */}
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Kartu Bebas Penjara ({partner.getOutOfJailCards} dimiliki):</div>
                  {partner.getOutOfJailCards > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: partner.getOutOfJailCards }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setGoojTo(goojTo === i + 1 ? i : i + 1)}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] border transition flex items-center gap-0.5",
                            goojTo >= i + 1
                              ? "bg-amber-100 dark:bg-amber-950/40 border-amber-400 text-amber-700 dark:text-amber-300 font-semibold"
                              : "border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
                          )}
                          title={`Minta ${i + 1} kartu`}
                        >
                          <Key className="w-2.5 h-2.5" /> {i + 1}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] italic text-muted-foreground">Tidak punya kartu</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Trade summary */}
          {(cashFrom > 0 || cashTo > 0 || propertiesFrom.length > 0 || propertiesTo.length > 0 || goojFrom > 0 || goojTo > 0) && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-2 text-xs">
              <div className="font-semibold mb-1 flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Ringkasan Trade:</div>
              <div className="space-y-0.5">
                {cashFrom > 0 && <div className="flex items-center gap-1"><Coins className="w-3 h-3 text-yellow-500" /> {me.name} → ${cashFrom.toLocaleString()} → {partner.name}</div>}
                {propertiesFrom.length > 0 && <div className="flex items-center gap-1"><Home className="w-3 h-3 text-zinc-500" /> {me.name} → {propertiesFrom.length} properti → {partner.name}</div>}
                {goojFrom > 0 && <div className="flex items-center gap-1"><Key className="w-3 h-3 text-amber-500" /> {me.name} → {goojFrom} kartu Bebas Penjara → {partner.name}</div>}
                {cashTo > 0 && <div className="flex items-center gap-1"><Coins className="w-3 h-3 text-yellow-500" /> {partner.name} → ${cashTo.toLocaleString()} → {me.name}</div>}
                {propertiesTo.length > 0 && <div className="flex items-center gap-1"><Home className="w-3 h-3 text-zinc-500" /> {partner.name} → {propertiesTo.length} properti → {me.name}</div>}
                {goojTo > 0 && <div className="flex items-center gap-1"><Key className="w-3 h-3 text-amber-500" /> {partner.name} → {goojTo} kartu Bebas Penjara → {me.name}</div>}
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!partner || (cashFrom === 0 && cashTo === 0 && propertiesFrom.length === 0 && propertiesTo.length === 0 && goojFrom === 0 && goojTo === 0)}
            className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" /> Ajukan Trade
          </Button>
        </>
      )}
    </div>
  );
}
