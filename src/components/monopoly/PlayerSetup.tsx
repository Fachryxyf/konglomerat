"use client";

import { useState } from "react";
import { useGame } from "@/lib/monopoly/gameStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AIDifficulty } from "@/lib/monopoly/types";
import { Smile, Target, Flame, User, Bot, ClipboardList, Play, type LucideIcon } from "lucide-react";
import BrandMark from "@/components/monopoly/BrandMark";

const TOKENS = ["🎩", "🚗", "🐕", "🐱", "🚢", "👞", "🏍️", "🦴"];
const COLORS = ["#E53935", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA", "#00ACC1", "#6D4C41", "#3949AB"];

interface PlayerConfig {
  name: string;
  type: "HUMAN" | "AI";
  difficulty: AIDifficulty;
}

const DIFFICULTY_LABELS: Record<AIDifficulty, { label: string; Icon: LucideIcon; color: string; desc: string }> = {
  EASY: { label: "Mudah", Icon: Smile, color: "text-emerald-500", desc: "Beli 60% properti, jarang bangun rumah, sering tolak properti mahal" },
  MEDIUM: { label: "Menengah", Icon: Target, color: "text-amber-500", desc: "Beli cerdas, jaga cadangan uang, bangun rumah saat monopoli" },
  HARD: { label: "Sulit", Icon: Flame, color: "text-rose-500", desc: "Agresif beli & bangun, pintar gadai, trade aktif untuk monopoli" },
};

const STARTING_CASH_OPTIONS = [300, 500, 750, 1000, 1500, 2000];

export default function PlayerSetup() {
  const init = useGame((s) => s.init);
  const [playerCount, setPlayerCount] = useState(4);
  const [startingCash, setStartingCash] = useState(500);
  const [players, setPlayers] = useState<PlayerConfig[]>(
    Array(4).fill(null).map((_, i) => ({
      name: `Pemain ${i + 1}`,
      type: i === 0 ? "HUMAN" : "AI",
      difficulty: "MEDIUM" as AIDifficulty,
    })),
  );

  const updatePlayerCount = (count: number) => {
    setPlayerCount(count);
    setPlayers(
      Array(count).fill(null).map((_, i) => ({
        name: `Pemain ${i + 1}`,
        type: i === 0 ? "HUMAN" : "AI",
        difficulty: "MEDIUM" as AIDifficulty,
      })),
    );
  };

  const updatePlayer = (i: number, field: keyof PlayerConfig, value: string) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const startGame = () => {
    init(players.filter((p) => p.name.trim() !== ""), startingCash);
  };

  return (
    <div className="h-screen flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
      <Card className="w-full max-w-4xl h-[min(94vh,780px)] p-0 gap-0 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="text-center px-6 pt-5 pb-3 shrink-0 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-2.5 tracking-tight">
            <BrandMark className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" /> KONGLOMERAT
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Bangun imperium properti & ekonomi di Kota Raya</p>
        </div>

        {/* Body: two columns on desktop */}
        <div className="flex-1 min-h-0 grid md:grid-cols-2 gap-4 px-6 py-4 overflow-y-auto md:overflow-hidden scrollbar-thin">
          {/* Left: settings + player list */}
          <div className="flex flex-col min-h-0">
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div>
                <Label className="text-sm font-semibold">Jumlah Pemain</Label>
                <Select value={String(playerCount)} onValueChange={(v) => updatePlayerCount(Number(v))}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} Pemain</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Modal Awal</Label>
                <Select value={String(startingCash)} onValueChange={(v) => setStartingCash(Number(v))}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STARTING_CASH_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>${n.toLocaleString()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Label className="text-sm font-semibold mt-3 mb-1.5 shrink-0">Pemain</Label>
            <div className="flex-1 min-h-0 md:overflow-y-auto pr-1 scrollbar-thin space-y-2">
              {players.map((p, i) => (
                <div key={i} className="rounded-lg border bg-card hover:bg-accent/50 transition p-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-full text-lg shrink-0 shadow-md"
                      style={{ backgroundColor: COLORS[i] }}
                    >
                      {TOKENS[i]}
                    </div>
                    <Input
                      value={p.name}
                      onChange={(e) => updatePlayer(i, "name", e.target.value)}
                      placeholder={`Nama Pemain ${i + 1}`}
                      className="flex-1 h-9"
                    />
                    <Select value={p.type} onValueChange={(v) => updatePlayer(i, "type", v)}>
                      <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HUMAN"><span className="inline-flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Manusia</span></SelectItem>
                        <SelectItem value="AI"><span className="inline-flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> AI</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {p.type === "AI" && (
                    <div className="mt-2">
                      <div className="grid grid-cols-3 gap-1">
                        {(["EASY", "MEDIUM", "HARD"] as AIDifficulty[]).map((diff) => {
                          const info = DIFFICULTY_LABELS[diff];
                          const isSelected = p.difficulty === diff;
                          return (
                            <button
                              key={diff}
                              type="button"
                              onClick={() => updatePlayer(i, "difficulty", diff)}
                              title={info.desc}
                              className={
                                "px-2 py-1 rounded-md text-xs border transition " +
                                (isSelected
                                  ? "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-300 font-semibold"
                                  : "border-zinc-300 dark:border-zinc-700 hover:bg-accent")
                              }
                            >
                              <span className="inline-flex items-center justify-center gap-1">
                                <info.Icon className={"w-3.5 h-3.5 " + info.color} />
                                {info.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: reference (rules + AI legend) */}
          <div className="md:overflow-y-auto scrollbar-thin space-y-3 md:pr-1">
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm text-muted-foreground border border-emerald-200 dark:border-emerald-900">
              <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5"><ClipboardList className="w-4 h-4" /> Aturan Standar</p>
              <ul className="space-y-1 text-xs">
                <li>• Modal awal ${startingCash.toLocaleString()} per pemain</li>
                <li>• Koleksi $200 saat melewati MULAI</li>
                <li>• 3x dadu kembar berturut-turut = masuk penjara</li>
                <li>• Bangun rumah/hotel hanya pada monopoli color set</li>
                <li>• Properti tak dibeli dilelang ke pemain lain</li>
                <li>• 32 rumah & 12 hotel tersedia (limited supply)</li>
              </ul>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-xs border border-blue-200 dark:border-blue-900">
              <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1.5 flex items-center gap-1.5"><Bot className="w-4 h-4" /> Level AI</p>
              <div className="space-y-1 text-[11px]">
                {(Object.keys(DIFFICULTY_LABELS) as AIDifficulty[]).map((diff) => {
                  const info = DIFFICULTY_LABELS[diff];
                  return (
                    <div key={diff} className="flex items-start gap-1.5">
                      <info.Icon className={"shrink-0 w-3.5 h-3.5 mt-0.5 " + info.color} />
                      <div>
                        <span className="font-semibold">{info.label}:</span>{" "}
                        <span className="text-muted-foreground">{info.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="hidden md:block text-[11px] text-muted-foreground italic px-1">
              Tip: tekan Spasi untuk lempar dadu saat bermain. Selengkapnya ada di tombol Panduan.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 shrink-0 border-t border-zinc-200 dark:border-zinc-800">
          <Button onClick={startGame} size="lg" className="w-full text-base font-semibold bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Play className="w-5 h-5 fill-current" /> MULAI BERMAIN
          </Button>
        </div>
      </Card>
    </div>
  );
}
