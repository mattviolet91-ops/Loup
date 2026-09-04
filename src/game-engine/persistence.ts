import type { GameState } from './types';

const STORAGE_KEY = 'loup-garou:game-state:v1';

/** Sérialise l'état de la partie pour le localStorage. Aucune donnée ne quitte jamais l'appareil. */
export function saveGameState(state: GameState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Stockage indisponible (navigation privée, quota atteint...) : on ignore silencieusement,
    // la partie reste jouable, seule la reprise après actualisation ne sera pas possible.
  }
}

export function loadGameState(): GameState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function hasSavedGame(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function clearGameState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
