// Générateur pseudo-aléatoire déterministe (mulberry32) afin que les parties
// soient reproductibles dans les tests tout en restant imprévisibles en jeu
// (la graine par défaut vient de Date.now() + crypto quand disponible).

export type RngState = number;

export function createSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0]! >>> 0;
  }
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

/** Retourne un flottant [0,1) et le nouvel état de la graine. */
export function nextFloat(seed: RngState): [number, RngState] {
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t = (t + Math.imul(t ^ (t >>> 7), t | 61)) >>> 0;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, t];
}

export function nextInt(seed: RngState, maxExclusive: number): [number, RngState] {
  const [f, nextSeed] = nextFloat(seed);
  return [Math.floor(f * maxExclusive), nextSeed];
}

/** Mélange de Fisher-Yates déterministe. Retourne le tableau mélangé + la graine finale. */
export function shuffle<T>(items: T[], seed: RngState): [T[], RngState] {
  const arr = [...items];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    const [j, nextSeed] = nextInt(s, i + 1);
    s = nextSeed;
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return [arr, s];
}

export function pick<T>(items: T[], seed: RngState): [T, RngState] {
  const [i, nextSeed] = nextInt(seed, items.length);
  return [items[i]!, nextSeed];
}
