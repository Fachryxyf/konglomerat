"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/lib/monopoly/gameStore";
import { sendIntent } from "@/lib/monopoly/use-intent";
import { useAIController } from "@/hooks/use-ai-controller";
import PlayerSetup from "@/components/monopoly/PlayerSetup";
import GameBoard from "@/components/monopoly/GameBoard";
import PlayerPanel from "@/components/monopoly/PlayerPanel";
import GameLog from "@/components/monopoly/GameLog";
import BuyModal from "@/components/monopoly/BuyModal";
import AuctionModal from "@/components/monopoly/AuctionModal";
import CardDrawModal from "@/components/monopoly/CardDrawModal";
import TaxModal from "@/components/monopoly/TaxModal";
import PropertyManagerModal from "@/components/monopoly/PropertyManagerModal";
import PropertyCatalogModal from "@/components/monopoly/PropertyCatalogModal";
import CardCatalogModal from "@/components/monopoly/CardCatalogModal";
import RentPaymentModal from "@/components/monopoly/RentPaymentModal";
import TradeProposalModal from "@/components/monopoly/TradeProposalModal";
import GameOverModal from "@/components/monopoly/GameOverModal";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import SpaceDetailModal from "@/components/monopoly/SpaceDetailModal";
import FiscalModal from "@/components/monopoly/FiscalModal";
import RescueModal from "@/components/monopoly/RescueModal";
import BankModal from "@/components/monopoly/BankModal";
import GovernmentModal from "@/components/monopoly/GovernmentModal";
import GuideModal from "@/components/monopoly/GuideModal";
import BrandMark from "@/components/monopoly/BrandMark";
import LanguageToggle from "@/components/monopoly/LanguageToggle";
import MobileWarning from "@/components/monopoly/MobileWarning";
import { getSpace } from "@/lib/monopoly/utils";
import { useT } from "@/lib/i18n";
import {
  LayoutGrid, Layers, RotateCcw, Check, List, Users, Lightbulb,
  Sparkles, X, Landmark, Scale, BookOpen,
} from "lucide-react";

const noop = () => {};

const EVENT_TIER_STYLE: Record<string, {
  tag: string; box: string; icon: string; label: string; title: string; detail: string;
}> = {
  REGULAR: {
    tag: "Event",
    box: "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/80",
    icon: "text-amber-500", label: "text-amber-600 dark:text-amber-400",
    title: "text-amber-800 dark:text-amber-200", detail: "text-amber-700/90 dark:text-amber-300/90",
  },
  SPECIAL: {
    tag: "Event Spesial",
    box: "border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/80",
    icon: "text-sky-500", label: "text-sky-600 dark:text-sky-400",
    title: "text-sky-800 dark:text-sky-200", detail: "text-sky-700/90 dark:text-sky-300/90",
  },
  RARE: {
    tag: "Event Langka",
    box: "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/80",
    icon: "text-violet-500", label: "text-violet-600 dark:text-violet-400",
    title: "text-violet-800 dark:text-violet-200", detail: "text-violet-700/90 dark:text-violet-300/90",
  },
  MYTHOS: {
    tag: "★ Event Mythos ★",
    box: "border-fuchsia-400 dark:border-fuchsia-600 bg-gradient-to-br from-amber-50 to-fuchsia-100 dark:from-fuchsia-950/80 dark:to-amber-950/80 ring-2 ring-fuchsia-400/40",
    icon: "text-fuchsia-500", label: "text-fuchsia-600 dark:text-fuchsia-300",
    title: "text-fuchsia-800 dark:text-fuchsia-200", detail: "text-fuchsia-700/90 dark:text-fuchsia-300/90",
  },
};

export default function Home() {
  const tr = useT();
  const players = useGame((s) => s.players);
  const turnPhase = useGame((s) => s.turnPhase);
  const pendingSpaceAction = useGame((s) => s.pendingSpaceAction);
  const pendingCard = useGame((s) => s.pendingCard);
  const auction = useGame((s) => s.auction);
  const pendingTrade = useGame((s) => s.pendingTrade);
  const winnerId = useGame((s) => s.winnerId);
  const reset = useGame((s) => s.reset);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const turn = useGame((s) => s.turn);
  const eventMessage = useGame((s) => s.eventMessage);
  const clearEvent = useGame((s) => s.clearEvent);
  const pendingFiscal = useGame((s) => s.pendingFiscal);
  const pendingRescue = useGame((s) => s.pendingRescue);

  const [managePlayer, setManagePlayer] = useState<number | null>(null);
  const [spaceInfoIndex, setSpaceInfoIndex] = useState<number | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState<"all" | "available" | "owned">("all");
  const [catalogPlayerId, setCatalogPlayerId] = useState<number | null>(null);
  const [showCardCatalog, setShowCardCatalog] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [showGov, setShowGov] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const pendingRent = useGame((s) => s.pendingRent);
  const dismissRent = useGame((s) => s.dismissRent);

  // Persisted state is only available on the client; defer the first render
  // until after mount so server and client markup match (no hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Auto-dismiss the periodic event banner after a few seconds.
  useEffect(() => {
    if (!eventMessage) return;
    const t = setTimeout(() => clearEvent(), 7000);
    return () => clearTimeout(t);
  }, [eventMessage, clearEvent]);

  // Run AI controller
  useAIController();

  // Derive modal visibility directly from game state
  const currentPlayer = players[currentPlayerIndex];
  const isHumanTurn = currentPlayer?.type === "HUMAN";

  // Show buy modal when human lands on unowned purchasable property
  const showBuyModal =
    isHumanTurn &&
    pendingSpaceAction !== null &&
    turnPhase === "ACTION" &&
    (() => {
      const space = getSpace(pendingSpaceAction);
      return space.type === "PROPERTY" || space.type === "RAILROAD" || space.type === "UTILITY";
    })();

  // Show tax modal when human lands on income tax
  const showTaxModal =
    isHumanTurn &&
    pendingSpaceAction !== null &&
    turnPhase === "ACTION" &&
    (() => {
      const space = getSpace(pendingSpaceAction);
      return space.type === "TAX" && (space as { taxType: string }).taxType === "INCOME";
    })();

  const showCardModal = pendingCard !== null;
  const showAuctionModal = auction.isActive;
  const showGameOver = winnerId !== null;

  // Spacebar: close the top-most dismissible overlay, or (if none) roll the dice
  // on the human's turn. Ignored while typing in a field.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) return;
      // Decision modals need an explicit choice — don't hijack space for them.
      if (showBuyModal || showTaxModal || showAuctionModal || pendingTrade || pendingFiscal || pendingRescue) return;

      if (eventMessage) { e.preventDefault(); clearEvent(); return; }
      if (spaceInfoIndex !== null) { e.preventDefault(); setSpaceInfoIndex(null); return; }
      if (managePlayer !== null) { e.preventDefault(); setManagePlayer(null); return; }
      if (showCatalog) { e.preventDefault(); setShowCatalog(false); return; }
      if (showCardCatalog) { e.preventDefault(); setShowCardCatalog(false); return; }
      if (showBank) { e.preventDefault(); setShowBank(false); return; }
      if (showGov) { e.preventDefault(); setShowGov(false); return; }
      if (showGuide) { e.preventDefault(); setShowGuide(false); return; }
      if (pendingCard) {
        // Skip the reveal with Space on ANY turn — including fast-forwarding an
        // AI's card so the human doesn't have to wait out its 3s countdown.
        e.preventDefault();
        sendIntent({ type: "DISMISS_CARD" });
        return;
      }
      if (pendingRent) { e.preventDefault(); dismissRent(); return; }
      if (showGameOver) return;

      // No overlay open → roll the dice if it's the human's turn.
      const s = useGame.getState();
      const cur = s.players[s.currentPlayerIndex];
      if (cur?.type === "HUMAN" && s.turnPhase === "WAITING_ROLL" && !cur.inJail) {
        e.preventDefault();
        sendIntent({ type: "ROLL_DICE" }, cur.id);
      }
    };
    // Capture phase so we run before Radix Dialog's react-remove-scroll, which
    // intercepts Space (a scroll key) and can stop it reaching a bubble listener.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [
    eventMessage, spaceInfoIndex, managePlayer, showCatalog, showCardCatalog, showBank, showGov, showGuide,
    pendingCard, pendingRent, pendingTrade, pendingFiscal, pendingRescue, showBuyModal, showTaxModal,
    showAuctionModal, showGameOver, clearEvent, dismissRent,
  ]);

  // Wait for client hydration before deciding which screen to show.
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2 bg-emerald-50 dark:bg-zinc-950 text-emerald-700 dark:text-emerald-300">
        <BrandMark className="w-6 h-6 animate-pulse" /> {tr("ui.loading")}
      </div>
    );
  }

  // Show setup screen if no players
  if (players.length === 0) {
    return <PlayerSetup />;
  }

  const handleSpaceClick = (index: number) => {
    setSpaceInfoIndex(index);
    // If clicked space is owned by current human player, open manager
    const player = players[currentPlayerIndex];
    if (player && player.type === "HUMAN" && player.properties.includes(index)) {
      setManagePlayer(player.id);
      setSpaceInfoIndex(null);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-emerald-950 flex flex-col">
      {/* Desktop-only gate — scoped to the game (not the root landing). */}
      <MobileWarning />
      {/* Header */}
      <header className="bg-emerald-800 dark:bg-emerald-950 text-white px-3 sm:px-4 py-2 shadow-md shrink-0">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2">
          <h1 className="text-sm sm:text-lg md:text-xl font-bold flex items-center gap-2 whitespace-nowrap tracking-tight">
            <BrandMark className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" /> Konglomerat
          </h1>
          <div className="flex items-center gap-1.5">
            <div className="text-[10px] sm:text-xs md:text-sm hidden sm:block truncate max-w-[200px]">
              {tr("ui.header.turn", { turn, name: players[currentPlayerIndex]?.name ?? "" })}
            </div>
            <LanguageToggle />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setCatalogFilter("all");
                setCatalogPlayerId(null);
                setShowCatalog(true);
              }}
              className="h-7 text-xs px-2 gap-1"
            >
              <LayoutGrid className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{tr("ui.header.properties")}</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowCardCatalog(true)}
              className="h-7 text-xs px-2 gap-1"
            >
              <Layers className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{tr("ui.header.cards")}</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowBank(true)}
              className="h-7 text-xs px-2 gap-1"
            >
              <Landmark className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{tr("ui.header.bank")}</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowGov(true)}
              className="h-7 text-xs px-2 gap-1"
            >
              <Scale className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{tr("ui.header.government")}</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowGuide(true)}
              className="h-7 text-xs px-2 gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{tr("ui.header.guide")}</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="secondary" className="h-7 text-xs px-2 gap-1">
                  <RotateCcw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{tr("ui.header.reset")}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tr("ui.reset.title")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {tr("ui.reset.desc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tr("ui.common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => reset()} className="bg-red-600 hover:bg-red-700">
                    {tr("ui.reset.confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Main layout - flex with proper wrapping */}
      <main className="flex-1 w-full max-w-[1560px] mx-auto p-2 sm:p-3 flex flex-col lg:flex-row gap-3 lg:gap-4 min-h-0 lg:overflow-hidden">
        {/* Board - square, capped by available viewport height so it always fits */}
        <div className="flex justify-center items-start lg:items-center lg:flex-1 lg:min-w-0 shrink-0 lg:shrink lg:h-full">
          <div className="w-full max-w-[min(94vw,calc((100vh-96px)*15/11))] lg:max-w-[clamp(720px,calc((100vh-96px)*15/11),1180px)]">
            <GameBoard onSpaceClick={handleSpaceClick} />
          </div>
        </div>

        {/* Sidebar - fixed width on desktop, scrolls internally so it never
            pushes the page taller than the viewport */}
        <aside className="w-full lg:w-[340px] lg:shrink-0 flex flex-col gap-3 min-w-0 lg:h-full lg:overflow-y-auto lg:pr-1 scrollbar-thin">
          {/* Quick property filters */}
          <div className="shrink-0 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-2">
            <div className="text-[10px] font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" /> {tr("ui.catalog.title")}
            </div>
            <div className="grid grid-cols-2 gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCatalogFilter("available");
                  setCatalogPlayerId(null);
                  setShowCatalog(true);
                }}
                className="h-7 text-[10px] px-2 gap-1"
              >
                <Check className="w-3 h-3" /> {tr("ui.catalog.available")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCatalogFilter("all");
                  setCatalogPlayerId(null);
                  setShowCatalog(true);
                }}
                className="h-7 text-[10px] px-2 gap-1"
              >
                <List className="w-3 h-3" /> {tr("ui.catalog.all")}
              </Button>
            </div>
            {/* Per-player quick view */}
            <div className="flex flex-wrap gap-1 mt-1">
              {players.filter((p) => !p.bankrupt).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setCatalogFilter("owned");
                    setCatalogPlayerId(p.id);
                    setShowCatalog(true);
                  }}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] border hover:bg-accent transition"
                  title={tr("ui.viewProps", { name: p.name })}
                >
                  <span>{p.token}</span>
                  <span className="hidden sm:inline">{p.name}</span>
                  <span className="opacity-60">({p.properties.length})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Players */}
          <div className="shrink-0">
            <div className="text-xs font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 px-1">
              <Users className="w-3.5 h-3.5 text-emerald-600" /> {tr("ui.players")}
            </div>
            <PlayerPanel onPlayerAction={(id) => setManagePlayer(id)} />
          </div>

          {/* Log - grows with content up to a cap, then scrolls internally */}
          <div className="shrink-0 flex flex-col">
            <GameLog />
          </div>

          {/* Help */}
          <div className="text-[11px] text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md border border-blue-200 dark:border-blue-900 shrink-0 flex gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <span><strong>{tr("ui.tips.label")}</strong> {tr("ui.tips.body")}</span>
          </div>
        </aside>
      </main>

      {/* Random event banner — styled by rarity tier. */}
      {eventMessage && (() => {
        const t = EVENT_TIER_STYLE[eventMessage.tier] ?? EVENT_TIER_STYLE.REGULAR;
        return (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,480px)] animate-step-in">
            <div className={`flex items-start gap-3 rounded-xl border backdrop-blur px-4 py-3 shadow-xl ${t.box}`}>
              <Sparkles className={`w-6 h-6 shrink-0 mt-0.5 ${t.icon}`} />
              <div className="flex-1 min-w-0">
                <div className={`text-[10px] font-bold uppercase tracking-widest ${t.label}`}>
                  {eventMessage.tier === "MYTHOS" ? `★ ${tr("event.tier.MYTHOS")} ★` : tr(`event.tier.${eventMessage.tier}`)}
                </div>
                <div className={`font-bold text-sm ${t.title}`}>{eventMessage.title}</div>
                <div className={`text-xs ${t.detail}`}>{eventMessage.detail}</div>
              </div>
              <button onClick={clearEvent} className={`shrink-0 ${t.icon} hover:opacity-70`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Modals — visibility is derived from game state, so these decisions
          are made via the modal buttons (which dispatch store actions).
          onClose is a no-op: the modal disappears once the state changes. */}
      {showBuyModal && <BuyModal onClose={noop} />}
      {showAuctionModal && <AuctionModal onClose={noop} />}
      {showCardModal && <CardDrawModal onClose={noop} />}
      {showTaxModal && <TaxModal onClose={noop} />}
      {managePlayer !== null && (
        <PropertyManagerModal
          playerId={managePlayer}
          onClose={() => setManagePlayer(null)}
        />
      )}
      {showCatalog && (
        <PropertyCatalogModal
          onClose={() => setShowCatalog(false)}
          initialFilter={catalogFilter}
          initialPlayerId={catalogPlayerId}
        />
      )}
      {showCardCatalog && <CardCatalogModal onClose={() => setShowCardCatalog(false)} />}
      {showBank && (() => {
        // Manage the current player's bank if they're human, otherwise show the
        // first human's standing (read-only borrowing — actions gate on turn).
        const target = currentPlayer?.type === "HUMAN"
          ? currentPlayerIndex
          : players.find((p) => p.type === "HUMAN" && !p.bankrupt)?.id ?? currentPlayerIndex;
        return <BankModal playerId={target} onClose={() => setShowBank(false)} />;
      })()}
      {showGov && (() => {
        const target = currentPlayer?.type === "HUMAN"
          ? currentPlayerIndex
          : players.find((p) => p.type === "HUMAN" && !p.bankrupt)?.id ?? currentPlayerIndex;
        return <GovernmentModal playerId={target} onClose={() => setShowGov(false)} />;
      })()}
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      {pendingRent && (
        <RentPaymentModal
          data={pendingRent}
          onClose={dismissRent}
        />
      )}
      {pendingTrade && <TradeProposalModal onClose={() => {}} />}
      <FiscalModal />
      <RescueModal />
      {showGameOver && <GameOverModal onClose={noop} />}
      {spaceInfoIndex !== null && (
        <SpaceDetailModal
          index={spaceInfoIndex}
          onClose={() => setSpaceInfoIndex(null)}
        />
      )}
    </div>
  );
}

