import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { gameReducer, type GameAction } from '../game-engine/engine';
import { loadGameState, saveGameState, clearGameState, hasSavedGame } from '../game-engine/persistence';
import { savePreferredOptions } from '../utils/settingsStorage';
import type { GameState } from '../game-engine/types';
import { useNarrator } from './useNarrator';

export interface UseGameResult {
  state: GameState | null;
  dispatch: (action: GameAction) => void;
  narrator: ReturnType<typeof useNarrator>;
  lastNarrationText: string | null;
  hasResumableGame: boolean;
  resumeSavedGame: () => void;
  resetToHome: () => void;
}

/**
 * Point d'entrée unique entre l'UI et le moteur de jeu : gère le state du
 * moteur, la sauvegarde/reprise locale, et la narration vocale associée à la
 * file de narration produite par le moteur.
 */
export function useGame(): UseGameResult {
  const [state, dispatch] = useReducer(gameReducer, null);
  const [hasResumableGame, setHasResumableGame] = useState(() => hasSavedGame());

  const options = state?.config.options;
  const narrator = useNarrator({
    enabled: options?.narrationEnabled ?? true,
    volume: options?.narrationVolume ?? 1,
    rate: options?.narrationRate ?? 1,
    voiceURI: options?.narrationVoiceURI ?? null,
  });

  const narratorRef = useRef(narrator);
  narratorRef.current = narrator;

  useEffect(() => {
    if (!state) return;
    saveGameState(state);
  }, [state]);

  useEffect(() => {
    if (options) savePreferredOptions(options);
  }, [options]);

  const [lastNarrationText, setLastNarrationText] = useState<string | null>(null);
  const spokenIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!state || state.narrationQueue.length === 0) return;
    for (const line of state.narrationQueue) {
      if (spokenIds.current.has(line.id)) continue;
      spokenIds.current.add(line.id);
      narratorRef.current.speak(line.text);
      setLastNarrationText(line.text);
      dispatch({ type: 'CONSUME_NARRATION', lineId: line.id });
    }
  }, [state]);

  const resetToHome = useCallback(() => {
    clearGameState();
    narratorRef.current.stop();
    setLastNarrationText(null);
    setHasResumableGame(false);
    dispatch({ type: 'RESET_TO_HOME' });
  }, []);

  const resumeSavedGame = useCallback(() => {
    const saved = loadGameState();
    if (saved) dispatch({ type: 'LOAD_STATE', state: saved });
  }, []);

  return { state, dispatch, narrator, lastNarrationText, hasResumableGame, resumeSavedGame, resetToHome };
}
