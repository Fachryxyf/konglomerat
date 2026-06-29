// ===== Injectable RNG seam (Phase 0: determinism) =====
// The whole engine draws randomness through `rng()` instead of `Math.random()`
// directly. By default it IS Math.random, so behaviour is unchanged. But it can
// be swapped for a seeded, deterministic generator — which is what an
// authoritative multiplayer server needs (server rolls the dice; clients can't
// "set" them) and what makes the engine reproducible in tests.

export type RngFn = () => number; // returns a float in [0, 1)

let current: RngFn = Math.random;

// The engine MUST call this, never Math.random() directly.
export function rng(): number {
  return current();
}

// Swap the generator (e.g. server-seeded). Returns the previous one so callers
// can restore it.
export function setRng(fn: RngFn): RngFn {
  const prev = current;
  current = fn;
  return prev;
}

export function resetRng(): void {
  current = Math.random;
}

// mulberry32: tiny, fast, well-distributed seeded PRNG. Deterministic for a given
// seed — used by the (future) server and by tests.
export function makeSeededRng(seed: number): RngFn {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convenience: seed the global RNG and return a restore fn.
export function seedRng(seed: number): RngFn {
  return setRng(makeSeededRng(seed));
}
