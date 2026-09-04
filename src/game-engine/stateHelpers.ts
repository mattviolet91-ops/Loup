import type { GameState, HistoryEventType, NarrationLine, Player } from './types';

let idCounter = 0;
export function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

export function updatePlayer(state: GameState, playerId: string, patch: Partial<Player>): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? { ...p, ...patch } : p)),
  };
}

export function updatePlayerWith(state: GameState, playerId: string, updater: (p: Player) => Player): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? updater(p) : p)),
  };
}

export function pushHistory(
  state: GameState,
  type: HistoryEventType,
  message: string,
): GameState {
  return {
    ...state,
    history: [
      ...state.history,
      {
        id: makeId('evt'),
        type,
        dayNumber: state.dayNumber,
        nightNumber: state.nightNumber,
        message,
        timestamp: Date.now(),
      },
    ],
  };
}

export function queueNarration(state: GameState, text: string, priority: NarrationLine['priority'] = 'normal'): GameState {
  return {
    ...state,
    narrationQueue: [...state.narrationQueue, { id: makeId('say'), text, priority }],
  };
}

export function clearNarrationLine(state: GameState, lineId: string): GameState {
  return { ...state, narrationQueue: state.narrationQueue.filter((l) => l.id !== lineId) };
}
