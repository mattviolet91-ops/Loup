import type { DeathCause, GameState } from './types';
import { getRole } from './roles';
import { findPlayer } from './selectors';
import { updatePlayer, pushHistory } from './stateHelpers';

export interface DeathResolution {
  state: GameState;
  actuallyDied: boolean;
  hunterIds: string[];
  deadPlayerIds: string[];
}

const CAUSE_LABEL: Record<DeathCause, string> = {
  WOLVES: 'dévoré par les Loups-Garous',
  WITCH_POISON: 'empoisonné par la Sorcière',
  VOTE: 'éliminé par le vote du village',
  HUNTER: 'abattu par le Chasseur',
  LOVER_GRIEF: "mort de chagrin après la mort de son Amoureux",
  PETITE_FILLE_SPOTTED: "repérée par les Loups-Garous en espionnant",
};

/**
 * Élimine un joueur en appliquant toutes les règles spéciales (vie
 * supplémentaire de l'Ancien, immunité de vote de l'Idiot du Village, perte
 * des pouvoirs du village si l'Ancien est voté, cascade des Amoureux,
 * libération des charmés si le Joueur de Flûte meurt, déclenchement du
 * Chasseur). Fonction pure : retourne un nouvel état.
 */
export function killPlayer(state: GameState, playerId: string, cause: DeathCause): DeathResolution {
  const player = findPlayer(state, playerId);
  if (!player.alive) {
    return { state, actuallyDied: false, hunterIds: [], deadPlayerIds: [] };
  }

  if (cause === 'WOLVES' && player.roleId === 'ANCIEN' && !player.ancienExtraLifeUsed && !player.powersDisabled) {
    const next = updatePlayer(state, playerId, { ancienExtraLifeUsed: true });
    return { state: next, actuallyDied: false, hunterIds: [], deadPlayerIds: [] };
  }

  if (cause === 'VOTE' && player.roleId === 'IDIOT_DU_VILLAGE' && !player.revealedAsIdiot && !player.powersDisabled) {
    const next = updatePlayer(state, playerId, { revealedAsIdiot: true, canVote: false });
    return { state: next, actuallyDied: false, hunterIds: [], deadPlayerIds: [] };
  }

  let next = updatePlayer(state, playerId, {
    alive: false,
    deathCause: cause,
    diedOnNight: state.night ? state.nightNumber : undefined,
    diedOnDay: state.night ? undefined : state.dayNumber,
    canVote: false,
  });
  next = pushHistory(next, 'NIGHT_DEATH', `${player.name} (${getRole(player.roleId).name}) — ${CAUSE_LABEL[cause]}.`);

  let hunterIds: string[] = [];
  let deadPlayerIds = [playerId];

  if (player.roleId === 'CHASSEUR' && !player.powersDisabled) {
    hunterIds.push(playerId);
  }

  if (cause === 'VOTE' && player.roleId === 'ANCIEN') {
    next = disableVillagePowers(next);
  }

  const loverIds = next.special.cupidLoverIds;
  if (loverIds && loverIds.includes(playerId)) {
    const otherId = loverIds[0] === playerId ? loverIds[1]! : loverIds[0]!;
    const other = next.players.find((p) => p.id === otherId);
    if (other && other.alive) {
      const cascade = killPlayer(next, otherId, 'LOVER_GRIEF');
      next = cascade.state;
      hunterIds = hunterIds.concat(cascade.hunterIds);
      deadPlayerIds = deadPlayerIds.concat(cascade.deadPlayerIds);
    }
  }

  if (player.roleId === 'JOUEUR_DE_FLUTE') {
    next = {
      ...next,
      players: next.players.map((p) => (p.charmed ? { ...p, charmed: false } : p)),
    };
  }

  return { state: next, actuallyDied: true, hunterIds, deadPlayerIds };
}

function disableVillagePowers(state: GameState): GameState {
  const withFlag: GameState = { ...state, special: { ...state.special, ancienPowersLost: true } };
  return {
    ...withFlag,
    players: withFlag.players.map((p) =>
      p.alive && getRole(p.roleId).team === 'VILLAGE' ? { ...p, powersDisabled: true } : p,
    ),
  };
}
