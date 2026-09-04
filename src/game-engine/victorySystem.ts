import type { GameState, VictoryResult } from './types';
import { getRole } from './roles';
import { alivePlayers, aliveByRole, aliveUniqueHolder, isRoleInPlay, otherAlivePlayers } from './selectors';

/**
 * Vérifie les conditions de victoire (voir RULES.md §9), dans l'ordre de
 * priorité : Amoureux > Joueur de Flûte > Village > Loups-Garous.
 */
export function checkVictory(state: GameState): VictoryResult | null {
  const alive = alivePlayers(state);

  const loverIds = state.special.cupidLoverIds;
  if (loverIds && alive.length === 2) {
    const aliveIds = new Set(alive.map((p) => p.id));
    if (loverIds.every((id) => aliveIds.has(id))) {
      return {
        winner: 'LOVERS',
        winningPlayerIds: [...loverIds],
        message: 'Les Amoureux sont les deux derniers survivants : ils remportent la partie ensemble !',
      };
    }
  }

  if (isRoleInPlay(state, 'JOUEUR_DE_FLUTE')) {
    const piper = aliveUniqueHolder(state, 'JOUEUR_DE_FLUTE');
    if (piper) {
      const others = otherAlivePlayers(state, piper.id);
      if (others.length > 0 && others.every((p) => p.charmed)) {
        return {
          winner: 'JOUEUR_DE_FLUTE',
          winningPlayerIds: [piper.id, ...others.map((p) => p.id)],
          message: 'Le Joueur de Flûte a charmé tout le village : il remporte la partie seul !',
        };
      }
    }
  }

  const wolvesAlive = aliveByRole(state, 'LOUP_GAROU');
  if (wolvesAlive.length === 0) {
    return {
      winner: 'VILLAGE',
      winningPlayerIds: alive.filter((p) => getRole(p.roleId).team === 'VILLAGE').map((p) => p.id),
      message: 'Tous les Loups-Garous ont été éliminés : le Village remporte la partie !',
    };
  }

  const othersAlive = alive.length - wolvesAlive.length;
  if (wolvesAlive.length >= othersAlive) {
    return {
      winner: 'WEREWOLVES',
      winningPlayerIds: wolvesAlive.map((p) => p.id),
      message: 'Les Loups-Garous sont désormais aussi nombreux que le reste du village : ils remportent la partie !',
    };
  }

  return null;
}
