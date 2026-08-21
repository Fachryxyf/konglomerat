"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

// True only after hydration. Lets components render the server-safe default on
// the first pass and switch to client-only state (persisted locale, theme)
// afterwards, without a setState-in-effect round trip.
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
