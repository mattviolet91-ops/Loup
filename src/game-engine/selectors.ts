import type { GameState, Player, RoleId } from './types';

export function findPlayer(state: GameState, playerId: string): Player {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error(`Joueur introuvable : ${playerId}`);
  return player;
}

export function alivePlayers(state: GameState): Player[] {
  return state.players.filter((p) => p.alive);
}

export function aliveByRole(state: GameState, roleId: RoleId): Player[] {
  return state.players.filter((p) => p.alive && p.roleId === roleId);
}

/** Pour les rôles uniques : le titulaire vivant, s'il existe. */
export function aliveUniqueHolder(state: GameState, roleId: RoleId): Player | null {
  return aliveByRole(state, roleId)[0] ?? null;
}

/** Comme `aliveUniqueHolder`, mais renvoie `null` si le pouvoir a été désactivé (cf. règle de l'Ancien). */
export function aliveActivePowerHolder(state: GameState, roleId: RoleId): Player | null {
  const holder = aliveUniqueHolder(state, roleId);
  return holder && !holder.powersDisabled ? holder : null;
}

export function isRoleInPlay(state: GameState, roleId: RoleId): boolean {
  return (state.config.roleCounts[roleId] ?? 0) > 0;
}

export function otherAlivePlayers(state: GameState, excludeId: string): Player[] {
  return alivePlayers(state).filter((p) => p.id !== excludeId);
}
