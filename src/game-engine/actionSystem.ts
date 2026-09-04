import type { GameState, NightActionPayload, NightStepKind, RoleId } from './types';
import { findPlayer, alivePlayers, aliveByRole } from './selectors';
import { updatePlayer, queueNarration } from './stateHelpers';
import { nextFloat, pick } from './rng';
import { NARRATION, roleName } from './narrator';

export interface ActionResult {
  state: GameState;
  /** Faux si l'étape de nuit courante doit rester active (ex : tous les loups n'ont pas encore voté). */
  advance: boolean;
}

export function applyNightAction(state: GameState, payload: NightActionPayload): ActionResult {
  switch (payload.kind) {
    case 'VOLEUR':
      return applyVoleur(state, payload.swapWith);
    case 'CUPIDON':
      return applyCupidon(state, payload.targetIds);
    case 'SALVATEUR':
      return applySalvateur(state, payload.targetId);
    case 'VOYANTE':
      return applyVoyante(state, payload.targetId);
    case 'LOUP_GAROU':
      return applyWolfVote(state, payload.wolfId, payload.targetId);
    case 'PETITE_FILLE':
      return applyPetiteFille(state, payload.spy);
    case 'SORCIERE':
      return applySorciere(state, payload.heal, payload.poisonTargetId);
    case 'JOUEUR_DE_FLUTE':
      return applyFlute(state, payload.targetIds);
    default:
      return { state, advance: true };
  }
}

function applyVoleur(state: GameState, swapWith: RoleId | null): ActionResult {
  const thief = aliveByRole(state, 'VOLEUR')[0];
  let next = state;
  if (thief) {
    const extra = next.special.voleurExtraRoles;
    // Règle officielle : l'échange est obligatoire si les deux cartes restantes sont des Loups-Garous.
    const mandatory = extra.length === 2 && extra.every((r) => r === 'LOUP_GAROU');
    const effectiveSwap = swapWith ?? (mandatory ? extra[0]! : null);
    if (effectiveSwap) {
      const idx = extra.indexOf(effectiveSwap);
      if (idx !== -1) {
        const newExtra = [...extra];
        newExtra[idx] = thief.startingRoleId;
        next = updatePlayer(next, thief.id, { roleId: effectiveSwap });
        next = { ...next, special: { ...next.special, voleurExtraRoles: newExtra } };
      }
    }
  }
  next = { ...next, special: { ...next.special, voleurHasActed: true } };
  return { state: next, advance: true };
}

function applyCupidon(state: GameState, targetIds: [string, string]): ActionResult {
  const next: GameState = {
    ...state,
    special: { ...state.special, cupidLoverIds: targetIds },
  };
  return { state: queueNarration(next, NARRATION.loversWake()), advance: true };
}

function applySalvateur(state: GameState, targetId: string): ActionResult {
  if (!state.night) return { state, advance: true };
  const next: GameState = {
    ...state,
    night: { ...state.night, salvateurProtectedId: targetId },
    special: { ...state.special, salvateurLastProtectedId: targetId },
  };
  return { state: next, advance: true };
}

function applyVoyante(state: GameState, targetId: string): ActionResult {
  if (!state.night) return { state, advance: true };
  const target = findPlayer(state, targetId);
  const next: GameState = {
    ...state,
    night: { ...state.night, seerResult: { targetId, roleId: target.roleId } },
  };
  return { state: next, advance: false };
}

function applyWolfVote(state: GameState, wolfId: string, targetId: string): ActionResult {
  if (!state.night) return { state, advance: true };
  const wolves = aliveByRole(state, 'LOUP_GAROU');
  const votes = { ...state.night.wolvesVotes, [wolfId]: targetId };
  let next: GameState = { ...state, night: { ...state.night, wolvesVotes: votes } };

  const allVoted = wolves.every((w) => votes[w.id]);
  if (!allVoted) {
    return { state: next, advance: false };
  }

  const tally = new Map<string, number>();
  for (const target of Object.values(votes)) {
    tally.set(target, (tally.get(target) ?? 0) + 1);
  }
  const maxVotes = Math.max(...tally.values());
  const topTargets = [...tally.entries()].filter(([, count]) => count === maxVotes).map(([id]) => id);

  let chosenId = topTargets[0]!;
  let seed = next.rngSeed;
  if (topTargets.length > 1) {
    const [chosen, nextSeed] = pick(topTargets, seed);
    chosenId = chosen;
    seed = nextSeed;
  }

  next = { ...next, rngSeed: seed, night: { ...next.night!, wolfVictimId: chosenId } };
  return { state: next, advance: true };
}

function applyPetiteFille(state: GameState, spy: boolean): ActionResult {
  if (!state.night) return { state, advance: true };
  if (!spy) {
    return { state: { ...state, night: { ...state.night, petiteFilleSpySpotted: false } }, advance: true };
  }
  const [roll, nextSeed] = nextFloat(state.rngSeed);
  const spotted = roll < state.config.options.spySpotChance;
  let next: GameState = {
    ...state,
    rngSeed: nextSeed,
    night: { ...state.night, petiteFilleSpySpotted: spotted },
  };
  if (spotted) {
    next = queueNarration(next, NARRATION.petiteFilleSpotted());
  }
  return { state: next, advance: false };
}

function applySorciere(state: GameState, heal: boolean, poisonTargetId: string | null): ActionResult {
  if (!state.night) return { state, advance: true };
  let next: GameState = state;
  if (heal && !next.special.witchHealUsed) {
    next = {
      ...next,
      special: { ...next.special, witchHealUsed: true },
      night: { ...next.night!, witchHealUsedTonight: true },
    };
  }
  if (poisonTargetId && !next.special.witchPoisonUsed) {
    next = {
      ...next,
      special: { ...next.special, witchPoisonUsed: true },
      night: { ...next.night!, witchPoisonTargetId: poisonTargetId },
    };
  }
  return { state: next, advance: true };
}

function applyFlute(state: GameState, targetIds: string[]): ActionResult {
  let next = state;
  for (const id of targetIds) {
    next = updatePlayer(next, id, { charmed: true });
  }
  next = {
    ...next,
    special: { ...next.special, piperCharmedIds: [...new Set([...next.special.piperCharmedIds, ...targetIds])] },
  };
  return { state: next, advance: true };
}

export function narrationForStepStart(state: GameState, kind: NightStepKind): string {
  switch (kind) {
    case 'VOLEUR':
      return NARRATION.thiefTurn();
    case 'CUPIDON':
      return NARRATION.cupidTurn();
    case 'LOVERS_REVEAL':
      return NARRATION.loversWake();
    case 'SALVATEUR':
      return NARRATION.salvateurTurn();
    case 'VOYANTE':
      return NARRATION.voyanteTurn();
    case 'LOUP_GAROU':
      return NARRATION.wolvesTurn();
    case 'PETITE_FILLE':
      return NARRATION.petiteFilleTurn();
    case 'SORCIERE': {
      const victimId = currentWolfVictimId(state);
      const victim = victimId ? alivePlayers(state).find((p) => p.id === victimId) : null;
      return NARRATION.sorciereTurn(victim ? victim.name : null);
    }
    case 'JOUEUR_DE_FLUTE':
      return NARRATION.fluteTurn();
    default:
      return '';
  }
}

export function currentWolfVictimId(state: GameState): string | null {
  if (!state.night) return null;
  if (state.night.petiteFilleSpySpotted === true) {
    const petiteFille = aliveByRole(state, 'PETITE_FILLE')[0];
    if (petiteFille) return petiteFille.id;
  }
  return state.night.wolfVictimId;
}

export { roleName };
