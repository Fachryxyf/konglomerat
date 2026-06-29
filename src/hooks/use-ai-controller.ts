"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/lib/monopoly/gameStore";
import { aiShouldBuyProperty, aiJailDecision, aiShouldBuild, aiShouldMortgage, aiProposeTrade, aiShouldAuctionOwn, aiBankDecision, aiGovernmentDecision } from "@/lib/monopoly/ai";
import { getSpace } from "@/lib/monopoly/utils";
import { getPrice } from "@/lib/monopoly/boardData";

/**
 * Hook that runs AI logic automatically based on game phase
 */
export function useAIController() {
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const turnPhase = useGame((s) => s.turnPhase);
  const pendingSpaceAction = useGame((s) => s.pendingSpaceAction);
  const pendingTrade = useGame((s) => s.pendingTrade);
  const pendingFiscal = useGame((s) => s.pendingFiscal);
  const pendingRescue = useGame((s) => s.pendingRescue);

  const rollDice = useGame((s) => s.rollDice);
  const buyProperty = useGame((s) => s.buyProperty);
  const declineBuy = useGame((s) => s.declineBuy);
  const jailDecision = useGame((s) => s.jailDecision);
  const buildHouse = useGame((s) => s.buildHouse);
  const buildHotel = useGame((s) => s.buildHotel);
  const mortgageProperty = useGame((s) => s.mortgageProperty);
  const endTurn = useGame((s) => s.endTurn);
  const pendingCard = useGame((s) => s.pendingCard);
  const dismissCard = useGame((s) => s.dismissCard);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tradeAttemptedTurnRef = useRef<number>(-1);
  const auctionAttemptedTurnRef = useRef<number>(-1);
  const bankAttemptedTurnRef = useRef<number>(-1);
  const govAttemptedTurnRef = useRef<number>(-1);

  useEffect(() => {
    // Clear any existing timers
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];

    const player = players[currentPlayerIndex];
    if (!player || player.type !== "AI" || player.bankrupt) return;

    // Wait for any in-flight trade (e.g. one this AI just proposed) to resolve
    // before taking further action this turn.
    if (pendingTrade) return;
    // Wait while a human resolves a Fiscal Year or rescue-investment decision.
    if (pendingFiscal || pendingRescue) return;

    const addTimer = (fn: () => void, delay: number) => {
      const t = setTimeout(fn, delay);
      timersRef.current.push(t);
    };

    if (turnPhase === "WAITING_ROLL") {
      if (player.inJail) {
        // Maybe bribe the guard out (corruption) before resorting to bail/roll.
        const gov = aiGovernmentDecision(useGame.getState(), player.id);
        if (gov?.type === "BRIBE_GUARD") {
          addTimer(() => useGame.getState().bribeGuard(player.id), 2200);
        } else {
          const decision = aiJailDecision(useGame.getState(), player.id);
          addTimer(() => jailDecision(decision), 2500);
        }
      } else {
        addTimer(() => rollDice(), 2000);
      }
    }

    if (turnPhase === "ACTION" && pendingSpaceAction !== null) {
      const space = getSpace(pendingSpaceAction);
      // Check if it's income tax
      if (space.type === "TAX" && (space as { taxType: string }).taxType === "INCOME") {
        const playerNet = player.balance + player.properties.reduce((sum, idx) => sum + getPrice(getSpace(idx)), 0);
        if (playerNet * 0.1 < 200) {
          addTimer(() => useGame.getState().payTenPercentTax(), 1800);
        } else {
          addTimer(() => useGame.getState().payFlatTax(), 1800);
        }
      } else if (space.type === "PROPERTY" || space.type === "RAILROAD" || space.type === "UTILITY") {
        if (aiShouldBuyProperty(useGame.getState(), player.id, pendingSpaceAction)) {
          addTimer(() => buyProperty(), 1800);
        } else {
          addTimer(() => declineBuy(), 1800);
        }
      }
    }

    if (turnPhase === "CARD_DRAW" && pendingCard) {
      // Card modal handles auto-dismiss for AI with countdown.
      // Fallback: if modal didn't dismiss after 8s, force dismiss.
      addTimer(() => {
        const s = useGame.getState();
        if (s.pendingCard && s.turnPhase === "CARD_DRAW") {
          dismissCard();
        }
      }, 8000);
    }

    if (turnPhase === "POST_ACTION") {
      // 0) Interact with the bank once per turn: borrow when cash-strapped but
      //    asset-rich, or repay early when flush. Re-evaluates next render.
      const curTurnBank = useGame.getState().turn;
      if (bankAttemptedTurnRef.current !== curTurnBank) {
        bankAttemptedTurnRef.current = curTurnBank;
        const bank = aiBankDecision(useGame.getState(), player.id);
        if (bank) {
          addTimer(() => {
            if (bank.type === "BORROW") useGame.getState().takeLoan(player.id, bank.amount, bank.term);
            else useGame.getState().repayLoan(player.id, bank.loanId);
          }, 1400);
          return;
        }
      }
      // 0b) Government "cara curang": lobby for regulation or cook the books.
      if (bankAttemptedTurnRef.current === curTurnBank) {
        const gov = aiGovernmentDecision(useGame.getState(), player.id);
        if (gov && gov.type !== "BRIBE_GUARD" && govAttemptedTurnRef.current !== curTurnBank) {
          govAttemptedTurnRef.current = curTurnBank;
          addTimer(() => {
            if (gov.type === "LOBBY") useGame.getState().lobbyRegulation(player.id);
            else if (gov.type === "EVADE") useGame.getState().armEvasion(player.id);
          }, 1400);
          return;
        }
      }
      // 1) Build if it makes sense (highest priority — develops monopolies).
      const buildAction = aiShouldBuild(useGame.getState(), player.id);
      if (buildAction) {
        addTimer(() => {
          if (buildAction.action === "HOUSE") buildHouse(buildAction.spaceIndex, buildAction.count);
          else buildHotel(buildAction.spaceIndex);
        }, 1500);
      } else {
        const curTurn = useGame.getState().turn;
        let proposed = false;

        // 2a) If badly cash-strapped, auction a spare property (once per turn).
        if (auctionAttemptedTurnRef.current !== curTurn) {
          auctionAttemptedTurnRef.current = curTurn;
          const auctionIdx = aiShouldAuctionOwn(useGame.getState(), player.id);
          if (auctionIdx !== null) {
            addTimer(() => useGame.getState().auctionOwnProperty(auctionIdx), 1500);
            proposed = true; // wait for the auction to resolve before doing more
          }
        }

        // 2b) Occasionally try to broker a trade (once per turn) — e.g. buy the
        //    last piece it needs for a monopoly from another player (AI or human).
        if (!proposed && tradeAttemptedTurnRef.current !== curTurn) {
          tradeAttemptedTurnRef.current = curTurn;
          // Keep it occasional and deliberate — only ~18% of eligible turns, and
          // aiProposeTrade only returns something when it can complete a monopoly.
          if (Math.random() < 0.18) {
            const offer = aiProposeTrade(useGame.getState(), player.id);
            if (offer) {
              addTimer(() => useGame.getState().proposeTrade(offer), 1500);
              proposed = true;
            }
          }
        }
        // 3) Otherwise mortgage to raise cash if low, or end the turn.
        if (!proposed) {
          const mortgageIdx = aiShouldMortgage(useGame.getState(), player.id);
          if (mortgageIdx !== null) {
            addTimer(() => mortgageProperty(mortgageIdx), 1500);
          } else {
            addTimer(() => endTurn(), 1500);
          }
        }
      }
    }

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, [players, currentPlayerIndex, turnPhase, pendingSpaceAction, pendingCard, pendingTrade, pendingFiscal, pendingRescue, rollDice, buyProperty, declineBuy, jailDecision, buildHouse, buildHotel, mortgageProperty, endTurn, dismissCard]);
}
