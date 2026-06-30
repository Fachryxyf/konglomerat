"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/lib/monopoly/gameStore";
import { aiShouldBuyProperty, aiJailDecision, aiShouldBuild, aiShouldMortgage, aiShouldUnmortgage, aiProposeTrade, aiShouldAuctionOwn, aiBankDecision, aiGovernmentDecision } from "@/lib/monopoly/ai";
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
  const pendingCard = useGame((s) => s.pendingCard);
  const dismissCard = useGame((s) => s.dismissCard);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tradeAttemptedTurnRef = useRef<number>(-1);
  const auctionAttemptedTurnRef = useRef<number>(-1);
  const bankAttemptedTurnRef = useRef<number>(-1);
  const govAttemptedTurnRef = useRef<number>(-1);
  const unmortgageAttemptedTurnRef = useRef<number>(-1);

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
        // Manage the estate BEFORE rolling — the only window an AI gets, since the
        // store auto-ends the turn shortly after the post-move action resolves.
        // One action per render (each mutates state → re-render → next action);
        // building repeats until done; once nothing's left, roll the dice.
        const curTurn = useGame.getState().turn;
        const MANAGE_DELAY = 1100;

        // 1) Bank: borrow to develop / stay liquid, or repay early when flush.
        if (bankAttemptedTurnRef.current !== curTurn) {
          bankAttemptedTurnRef.current = curTurn;
          const bank = aiBankDecision(useGame.getState(), player.id);
          if (bank) {
            addTimer(() => {
              if (bank.type === "BORROW") useGame.getState().takeLoan(player.id, bank.amount, bank.term);
              else useGame.getState().repayLoan(player.id, bank.loanId);
            }, MANAGE_DELAY);
            return;
          }
        }
        // 2) Government "cara curang": lobby for regulation, or cook the books.
        if (govAttemptedTurnRef.current !== curTurn) {
          govAttemptedTurnRef.current = curTurn;
          const gov = aiGovernmentDecision(useGame.getState(), player.id);
          if (gov && gov.type !== "BRIBE_GUARD") {
            addTimer(() => {
              if (gov.type === "LOBBY") useGame.getState().lobbyRegulation(player.id);
              else if (gov.type === "EVADE") useGame.getState().armEvasion(player.id);
            }, MANAGE_DELAY);
            return;
          }
        }
        // 3) Build on monopolies (repeatable — keeps developing until it can't).
        const buildAction = aiShouldBuild(useGame.getState(), player.id);
        if (buildAction) {
          addTimer(() => {
            if (buildAction.action === "HOUSE") buildHouse(buildAction.spaceIndex, buildAction.count);
            else buildHotel(buildAction.spaceIndex);
          }, MANAGE_DELAY);
          return;
        }
        // 4) Redeem a mortgaged property when comfortably flush.
        if (unmortgageAttemptedTurnRef.current !== curTurn) {
          unmortgageAttemptedTurnRef.current = curTurn;
          const redeemIdx = aiShouldUnmortgage(useGame.getState(), player.id);
          if (redeemIdx !== null) {
            addTimer(() => useGame.getState().unmortgageProperty(redeemIdx), MANAGE_DELAY);
            return;
          }
        }
        // 5) Cash-strapped: auction a spare property to other players.
        if (auctionAttemptedTurnRef.current !== curTurn) {
          auctionAttemptedTurnRef.current = curTurn;
          const auctionIdx = aiShouldAuctionOwn(useGame.getState(), player.id);
          if (auctionIdx !== null) {
            addTimer(() => useGame.getState().auctionOwnProperty(auctionIdx), MANAGE_DELAY);
            return;
          }
        }
        // 6) Broker a trade to complete/consolidate a monopoly (tier-scaled).
        if (tradeAttemptedTurnRef.current !== curTurn) {
          tradeAttemptedTurnRef.current = curTurn;
          const tradeGate = player.difficulty === "HARD" ? 0.85 : player.difficulty === "EASY" ? 0.3 : 0.6;
          if (Math.random() < tradeGate) {
            const offer = aiProposeTrade(useGame.getState(), player.id);
            if (offer) {
              addTimer(() => useGame.getState().proposeTrade(offer), MANAGE_DELAY);
              return;
            }
          }
        }
        // Nothing left to manage → roll the dice.
        addTimer(() => rollDice(), 1300);
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

    // POST_ACTION: the store auto-advances to endTurn shortly after the move
    // resolves, so the AI does no management here (it manages in WAITING_ROLL,
    // before rolling — the same window a human gets). A safety net: if a debt
    // left the AI needing cash, raise it so the turn can settle cleanly.
    if (turnPhase === "POST_ACTION") {
      const mortgageIdx = aiShouldMortgage(useGame.getState(), player.id);
      if (mortgageIdx !== null) addTimer(() => mortgageProperty(mortgageIdx), 300);
    }

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, [players, currentPlayerIndex, turnPhase, pendingSpaceAction, pendingCard, pendingTrade, pendingFiscal, pendingRescue, rollDice, buyProperty, declineBuy, jailDecision, buildHouse, buildHotel, mortgageProperty, dismissCard]);
}
