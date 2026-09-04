import { DEFAULT_OPTIONS } from '../game-engine/config';
import type { GameOptions } from '../game-engine/types';

const KEY = 'loup-garou:preferences:v1';

/** Préférences utilisateur persistées entre les parties (voix, thème, animations...). */
export function loadPreferredOptions(): GameOptions {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_OPTIONS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_OPTIONS, ...parsed };
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
}

export function savePreferredOptions(options: GameOptions): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(options));
  } catch {
    // stockage indisponible : les préférences ne seront simplement pas retenues.
  }
}
