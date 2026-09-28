/**
 * Pure, dependency-free deterministic randomness for the hero convergence
 * field. `field.ts` seeds one of these per `createField()` call so the same
 * seed always reproduces the same chaos cloud, hub graph and particle
 * assignment — required for the unit tests and for a stable-looking hero
 * across renders/reloads.
 */

/**
 * mulberry32: a small, fast 32-bit PRNG. Not cryptographic — it only needs
 * to be deterministic and reasonably well distributed for visual scatter.
 * Returns a function that yields floats in [0, 1) on every call.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeededRng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform float in [min, max). */
  range(min: number, max: number): number;
  /** Standard normal sample (mean 0, std 1) via Box-Muller. */
  gaussian(): number;
}

export function createRng(seed: number): SeededRng {
  const next = mulberry32(seed);
  // Box-Muller produces two independent samples per pair of uniforms; the
  // second is cached so consecutive gaussian() calls stay cheap and the
  // sequence stays deterministic regardless of call pattern.
  let spare: number | null = null;

  return {
    next,
    range(min: number, max: number): number {
      return min + next() * (max - min);
    },
    gaussian(): number {
      if (spare !== null) {
        const value = spare;
        spare = null;
        return value;
      }
      let u = 0;
      let v = 0;
      // Avoid log(0).
      while (u === 0) u = next();
      while (v === 0) v = next();
      const mag = Math.sqrt(-2 * Math.log(u));
      const angle = 2 * Math.PI * v;
      spare = mag * Math.sin(angle);
      return mag * Math.cos(angle);
    },
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
