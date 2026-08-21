"use client";

import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { useGame } from "./gameStore";
import type { Intent } from "./intents";

// ===== The UI's only way to change game state =====
// Every player-initiated change goes through `dispatch`, which runs the same
// three gates an authoritative server will run: parseIntent (shape) →
// validateIntent (rules) → apply → checkInvariants. Calling store actions
// directly bypasses all of that, so components should always use this hook.
//
// Rejections surface as a toast: previously an illegal action failed silently
// (the store's guards just `return`ed), leaving the player with a dead button and
// no reason why.
export function useIntent() {
  const dispatch = useGame((s) => s.dispatch);

  return useCallback(
    (intent: Intent, actorId?: number): boolean => {
      const result = dispatch(intent, actorId);
      if (!result.ok) {
        toast({ variant: "destructive", title: result.reason });
        return false;
      }
      return true;
    },
    [dispatch],
  );
}

// Non-hook variant for callers outside React render (timers, the AI controller).
// Silent by default: an AI's rejected intent is a bug to log, not a toast to show
// the human player.
export function sendIntent(intent: Intent, actorId?: number): boolean {
  const result = useGame.getState().dispatch(intent, actorId);
  if (!result.ok && process.env.NODE_ENV !== "production") {
    console.warn("[intent] ditolak:", intent.type, "—", result.reason);
  }
  return result.ok;
}
