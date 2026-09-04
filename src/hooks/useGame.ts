import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { gameReducer, type GameAction } from '../game-engine/engine';
import { loadGameState, saveGameState, clearGameState, hasSavedGame } from '../game-engine/persistence';
import { savePreferredOptions } from '../utils/settingsStorage';
import { DEFAULT_OPTIONS } from '../game-engine/config';
import type { GameOptions, GameState } from '../game-engine/types';
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
 *
 * `fallbackOptions` sont les préférences de l'utilisateur, utilisées tant
 * qu'aucune partie n'est en cours (écran d'accueil, réglages) : sans elles, le
 * narrateur parlerait avec les réglages d'usine au lieu de ceux choisis.
 */
export function useGame(fallbackOptions: GameOptions): UseGameResult {
  const [state, dispatch] = useReducer(gameReducer, null);
  const [hasResumableGame, setHasResumableGame] = useState(() => hasSavedGame());

  const gameOptions = state?.config.options;
  const options = gameOptions ?? fallbackOptions;
  // Les `??` couvrent aussi les parties sauvegardées avant l'ajout d'une option.
  const narrator = useNarrator({
    enabled: options.narrationEnabled ?? DEFAULT_OPTIONS.narrationEnabled,
    volume: options.narrationVolume ?? DEFAULT_OPTIONS.narrationVolume,
    rate: options.narrationRate ?? DEFAULT_OPTIONS.narrationRate,
    pitch: options.narrationPitch ?? DEFAULT_OPTIONS.narrationPitch,
    voiceURI: options.narrationVoiceURI ?? DEFAULT_OPTIONS.narrationVoiceURI,
  });

  const narratorRef = useRef(narrator);
  narratorRef.current = narrator;

  useEffect(() => {
    if (!state) return;
    saveGameState(state);
  }, [state]);

  // Seuls les réglages modifiés en cours de partie sont à persister ici : ceux
  // de l'accueil le sont déjà au moment où l'utilisateur les change.
  useEffect(() => {
    if (gameOptions) savePreferredOptions(gameOptions);
  }, [gameOptions]);

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
