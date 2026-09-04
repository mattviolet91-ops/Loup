import type { GameState, NightStepKind } from './types';
import { aliveUniqueHolder, aliveActivePowerHolder, aliveByRole, isRoleInPlay } from './selectors';

/**
 * Ordre fixe des étapes de nuit (voir RULES.md §5). L'index dans ce tableau
 * est stocké dans `night.stepIndex` ; l'éligibilité réelle d'une étape est
 * recalculée dynamiquement (elle dépend d'événements survenus plus tôt dans
 * la même nuit, comme le choix de Cupidon ou l'issue de l'attaque des loups).
 */
export const FIXED_NIGHT_ORDER: NightStepKind[] = [
  'VOLEUR',
  'CUPIDON',
  'LOVERS_REVEAL',
  'SALVATEUR',
  'VOYANTE',
  'LOUP_GAROU',
  'PETITE_FILLE',
  'SORCIERE',
  'JOUEUR_DE_FLUTE',
];

export function isStepEligible(state: GameState, kind: NightStepKind): boolean {
  const isFirstNight = state.nightNumber === 1;
  switch (kind) {
    case 'VOLEUR':
      return isFirstNight && isRoleInPlay(state, 'VOLEUR') && !state.special.voleurHasActed;
    case 'CUPIDON':
      return (
        isFirstNight &&
        isRoleInPlay(state, 'CUPIDON') &&
        state.special.cupidLoverIds === null &&
        aliveUniqueHolder(state, 'CUPIDON') !== null
      );
    case 'LOVERS_REVEAL':
      return isFirstNight && state.special.cupidLoverIds !== null && !(state.night?.loversRevealed ?? false);
    case 'SALVATEUR':
      return isRoleInPlay(state, 'SALVATEUR') && aliveActivePowerHolder(state, 'SALVATEUR') !== null;
    case 'VOYANTE':
      return isRoleInPlay(state, 'VOYANTE') && aliveActivePowerHolder(state, 'VOYANTE') !== null;
    case 'LOUP_GAROU':
      return aliveByRole(state, 'LOUP_GAROU').length > 0;
    case 'PETITE_FILLE':
      return isRoleInPlay(state, 'PETITE_FILLE') && aliveActivePowerHolder(state, 'PETITE_FILLE') !== null;
    case 'SORCIERE': {
      if (!isRoleInPlay(state, 'SORCIERE')) return false;
      if (aliveActivePowerHolder(state, 'SORCIERE') === null) return false;
      return !state.special.witchHealUsed || !state.special.witchPoisonUsed;
    }
    case 'JOUEUR_DE_FLUTE':
      return isRoleInPlay(state, 'JOUEUR_DE_FLUTE') && aliveUniqueHolder(state, 'JOUEUR_DE_FLUTE') !== null;
    default:
      return false;
  }
}

/** Avance l'index de nuit jusqu'à la prochaine étape éligible, ou jusqu'à la fin (résolution). */
export function advanceToEligibleStep(state: GameState, fromIndex: number): number {
  let index = fromIndex;
  while (index < FIXED_NIGHT_ORDER.length && !isStepEligible(state, FIXED_NIGHT_ORDER[index]!)) {
    index += 1;
  }
  return index;
}

export function currentNightStepKind(state: GameState): NightStepKind | null {
  if (!state.night) return null;
  const { stepIndex } = state.night;
  return stepIndex < FIXED_NIGHT_ORDER.length ? FIXED_NIGHT_ORDER[stepIndex]! : null;
}

export function getStepActorIds(state: GameState, kind: NightStepKind): string[] {
  switch (kind) {
    case 'VOLEUR':
      return mapIds(aliveByRole(state, 'VOLEUR'));
    case 'CUPIDON':
      return mapIds(aliveByRole(state, 'CUPIDON'));
    case 'LOVERS_REVEAL':
      return state.special.cupidLoverIds ? [...state.special.cupidLoverIds] : [];
    case 'SALVATEUR':
      return mapIds(aliveByRole(state, 'SALVATEUR'));
    case 'VOYANTE':
      return mapIds(aliveByRole(state, 'VOYANTE'));
    case 'LOUP_GAROU':
      return mapIds(aliveByRole(state, 'LOUP_GAROU'));
    case 'PETITE_FILLE':
      return mapIds(aliveByRole(state, 'PETITE_FILLE'));
    case 'SORCIERE':
      return mapIds(aliveByRole(state, 'SORCIERE'));
    case 'JOUEUR_DE_FLUTE':
      return mapIds(aliveByRole(state, 'JOUEUR_DE_FLUTE'));
    default:
      return [];
  }
}

function mapIds(players: { id: string }[]): string[] {
  return players.map((p) => p.id);
}
