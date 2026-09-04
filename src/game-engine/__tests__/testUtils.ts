import { createInitialState, gameReducer, type GameAction } from '../engine';
import { createDefaultConfig } from '../config';
import type { GameConfig, GameState, RoleCounts, RoleId } from '../types';

/** Comme `gameReducer`, mais garantit un `GameState` non nul (pratique dans les tests, où une partie est toujours en cours). */
export function step(state: GameState, action: GameAction): GameState {
  const next = gameReducer(state, action);
  if (!next) throw new Error(`gameReducer a renvoyé un état nul pour l'action ${action.type}`);
  return next;
}

/**
 * Construit une partie de test avec une distribution de rôles déterministe
 * (le joueur `names[i]` reçoit `roles[i]`), pour pouvoir tester chaque
 * mécanique indépendamment du mélange aléatoire.
 */
export function buildTestGame(names: string[], roles: RoleId[], configOverrides?: Partial<GameConfig>): GameState {
  if (names.length !== roles.length) {
    throw new Error('names et roles doivent avoir la même longueur dans les tests.');
  }
  const roleCounts: RoleCounts = {};
  for (const r of roles) roleCounts[r] = (roleCounts[r] ?? 0) + 1;

  const config: GameConfig = {
    ...createDefaultConfig(names.length),
    roleCounts,
    ...configOverrides,
  };

  let state = createInitialState(config, names, 42);
  state = {
    ...state,
    players: state.players.map((p, i) => ({ ...p, roleId: roles[i]!, startingRoleId: roles[i]! })),
  };
  return state;
}

/** Fait passer tous les joueurs par l'écran de révélation de rôle. */
export function skipRoleReveal(state: GameState): GameState {
  let next = state;
  while (next.phase === 'ROLE_REVEAL') {
    next = step(next, { type: 'ACK_ROLE_SEEN' });
  }
  return next;
}

export function playerId(state: GameState, name: string): string {
  const p = state.players.find((pl) => pl.name === name);
  if (!p) throw new Error(`Joueur de test introuvable : ${name}`);
  return p.id;
}
