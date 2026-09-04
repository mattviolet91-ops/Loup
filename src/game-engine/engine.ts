import type {
  GameConfig,
  GameState,
  NightActionPayload,
  NightState,
  RoleId,
  VictoryResult,
} from './types';
import { validateGameConfig, buildBaseDeck, pickThiefExtraRoles, totalRoleCount } from './config';
import { shuffle, createSeed } from './rng';
import { findPlayer, aliveByRole } from './selectors';
import { updatePlayer, pushHistory, queueNarration, makeId, clearNarrationLine } from './stateHelpers';
import { FIXED_NIGHT_ORDER, advanceToEligibleStep, currentNightStepKind } from './nightOrder';
import { applyNightAction, narrationForStepStart } from './actionSystem';
import { killPlayer } from './deathSystem';
import { checkVictory } from './victorySystem';
import { startVote, castVote, isVoteRoundComplete, resolveVoteRound, isVoteFinal } from './voteSystem';
import { NARRATION, roleName } from './narrator';

export type GameAction =
  | { type: 'NEW_GAME'; config: GameConfig; playerNames: string[]; seed?: number }
  | { type: 'ACK_ROLE_SEEN' }
  | { type: 'BEGIN_NIGHT' }
  | { type: 'NIGHT_ACTION'; payload: NightActionPayload }
  | { type: 'NIGHT_ACK' }
  | { type: 'START_DISCUSSION' }
  | { type: 'END_DISCUSSION' }
  | { type: 'CAST_VOTE'; voterId: string; targetId: string | 'ABSTAIN' }
  | { type: 'HUNTER_SHOOT'; targetId: string }
  | { type: 'SCAPEGOAT_CHOOSE_VOTERS'; voterIds: string[] }
  | { type: 'CONTINUE_AFTER_RESULT' }
  | { type: 'CONSUME_NARRATION'; lineId: string }
  | { type: 'UPDATE_OPTIONS'; options: Partial<GameState['config']['options']> }
  | { type: 'RESET_TO_HOME' }
  | { type: 'LOAD_STATE'; state: GameState };

export function createInitialState(config: GameConfig, playerNames: string[], seed = createSeed()): GameState {
  const validation = validateGameConfig(config);
  if (!validation.valid) {
    throw new Error(`Configuration invalide : ${validation.errors.join(' ')}`);
  }
  if (playerNames.length !== config.playerCount) {
    throw new Error('Le nombre de prénoms ne correspond pas au nombre de joueurs.');
  }

  let rngSeed = seed;
  const baseDeck = buildBaseDeck(config.roleCounts);
  const [shuffledDeck, seedAfterShuffle] = shuffle(baseDeck, rngSeed);
  rngSeed = seedAfterShuffle;

  let voleurExtraRoles: RoleId[] = [];
  if ((config.roleCounts.VOLEUR ?? 0) > 0) {
    const [extra, seedAfterPick] = pickThiefExtraRoles(config.roleCounts, rngSeed);
    voleurExtraRoles = extra;
    rngSeed = seedAfterPick;
  }

  const players = playerNames.map((name, i) => {
    const roleId = shuffledDeck[i]!;
    return {
      id: makeId('player'),
      name: name.trim(),
      roleId,
      startingRoleId: roleId,
      alive: true,
      charmed: false,
      powersDisabled: false,
      canVote: true,
      revealedAsIdiot: false,
      ancienExtraLifeUsed: false,
      hasSeenRole: false,
    };
  });

  let state: GameState = {
    phase: 'ROLE_REVEAL',
    config,
    players,
    dayNumber: 0,
    nightNumber: 0,
    history: [],
    narrationQueue: [],
    night: null,
    vote: null,
    hunter: null,
    roleReveal: { order: players.map((p) => p.id), currentIndex: 0 },
    victory: null,
    special: {
      witchHealUsed: false,
      witchPoisonUsed: false,
      cupidLoverIds: null,
      salvateurLastProtectedId: null,
      voleurExtraRoles,
      voleurHasActed: false,
      piperCharmedIds: [],
      boucEmissaireAllowedVoters: null,
      ancienPowersLost: false,
    },
    rngSeed,
    lastCycleDeaths: [],
  };

  state = pushHistory(state, 'GAME_STARTED', `Nouvelle partie : ${players.length} joueurs.`);
  state = queueNarration(state, NARRATION.gameStart(), 'high');
  return state;
}

export function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  if (action.type === 'NEW_GAME') {
    return createInitialState(action.config, action.playerNames, action.seed);
  }
  if (action.type === 'LOAD_STATE') {
    return action.state;
  }
  if (action.type === 'RESET_TO_HOME') {
    return null;
  }
  if (!state) return state;

  switch (action.type) {
    case 'ACK_ROLE_SEEN':
      return handleAckRoleSeen(state);
    case 'BEGIN_NIGHT':
      return beginNight(state);
    case 'NIGHT_ACTION':
      return handleNightAction(state, action.payload);
    case 'NIGHT_ACK':
      return handleNightAck(state);
    case 'START_DISCUSSION':
      return state.phase === 'DAY_ANNOUNCEMENT' ? { ...state, phase: 'DISCUSSION' } : state;
    case 'END_DISCUSSION':
      return handleEndDiscussion(state);
    case 'CAST_VOTE':
      return handleCastVote(state, action.voterId, action.targetId);
    case 'HUNTER_SHOOT':
      return handleHunterShoot(state, action.targetId);
    case 'SCAPEGOAT_CHOOSE_VOTERS':
      return handleScapegoatChoice(state, action.voterIds);
    case 'CONTINUE_AFTER_RESULT':
      return handleContinueAfterResult(state);
    case 'CONSUME_NARRATION':
      return clearNarrationLine(state, action.lineId);
    case 'UPDATE_OPTIONS':
      return { ...state, config: { ...state.config, options: { ...state.config.options, ...action.options } } };
    default:
      return state;
  }
}

function handleAckRoleSeen(state: GameState): GameState {
  if (!state.roleReveal || state.phase !== 'ROLE_REVEAL') return state;
  const currentId = state.roleReveal.order[state.roleReveal.currentIndex];
  let next = currentId ? updatePlayer(state, currentId, { hasSeenRole: true }) : state;
  const nextIndex = state.roleReveal.currentIndex + 1;
  if (nextIndex >= state.roleReveal.order.length) {
    next = { ...next, roleReveal: null };
    return beginNight(next);
  }
  next = { ...next, roleReveal: { ...state.roleReveal, currentIndex: nextIndex } };
  return next;
}

function beginNight(state: GameState): GameState {
  let next: GameState = {
    ...state,
    phase: 'NIGHT',
    nightNumber: state.nightNumber + 1,
    lastCycleDeaths: [],
    night: emptyNightState(),
  };
  next = pushHistory(next, 'NIGHT_STARTED', `Nuit ${next.nightNumber}.`);
  next = queueNarration(next, NARRATION.nightFalls(next.nightNumber), 'high');

  const startIndex = advanceToEligibleStep(next, 0);
  next = { ...next, night: { ...next.night!, stepIndex: startIndex } };
  next = announceCurrentStep(next);
  if (startIndex >= FIXED_NIGHT_ORDER.length) {
    next = resolveNight(next);
  }
  return next;
}

function emptyNightState(): NightState {
  return {
    stepIndex: 0,
    wolvesVotes: {},
    wolfVictimId: null,
    salvateurProtectedId: null,
    seerResult: null,
    witchHealUsedTonight: false,
    witchPoisonTargetId: null,
    petiteFilleSpySpotted: null,
    loversRevealed: false,
  };
}

function announceCurrentStep(state: GameState): GameState {
  const kind = currentNightStepKind(state);
  if (!kind) return state;
  const text = narrationForStepStart(state, kind);
  return text ? queueNarration(state, text) : state;
}

function handleNightAction(state: GameState, payload: NightActionPayload): GameState {
  if (state.phase !== 'NIGHT' || !state.night) return state;
  const kind = currentNightStepKind(state);
  if (!kind || kind !== payload.kind) return state;

  const result = applyNightAction(state, payload);
  let next = result.state;
  if (!result.advance) {
    return next;
  }
  return advanceNight(next);
}

function handleNightAck(state: GameState): GameState {
  if (state.phase !== 'NIGHT' || !state.night) return state;
  let next: GameState = {
    ...state,
    night: { ...state.night, seerResult: null },
  };
  return advanceNight(next);
}

function advanceNight(state: GameState): GameState {
  if (!state.night) return state;
  const kind = currentNightStepKind(state);
  let next = state;
  if (kind === 'LOVERS_REVEAL') {
    next = { ...next, night: { ...next.night!, loversRevealed: true } };
  }
  const nextIndex = advanceToEligibleStep(next, next.night!.stepIndex + 1);
  next = { ...next, night: { ...next.night!, stepIndex: nextIndex } };
  if (nextIndex >= FIXED_NIGHT_ORDER.length) {
    return resolveNight(next);
  }
  return announceCurrentStep(next);
}

function resolveNight(state: GameState): GameState {
  let next: GameState = { ...state, night: state.night ?? emptyNightState() };
  const night = next.night!;

  const protectedId = night.salvateurProtectedId;
  const wolfVictimId = night.wolfVictimId;
  const spotted = night.petiteFilleSpySpotted === true;
  const petiteFille = aliveByRole(next, 'PETITE_FILLE')[0] ?? null;

  let hunterIds: string[] = [];

  if (wolfVictimId) {
    const actualVictimId = spotted && petiteFille ? petiteFille.id : wolfVictimId;
    const isHealed = night.witchHealUsedTonight;
    const isProtected = protectedId === actualVictimId;
    if (!isHealed && !isProtected) {
      const res = killPlayer(next, actualVictimId, spotted ? 'PETITE_FILLE_SPOTTED' : 'WOLVES');
      next = res.state;
      hunterIds = hunterIds.concat(res.hunterIds);
      next = { ...next, lastCycleDeaths: [...next.lastCycleDeaths, ...res.deadPlayerIds] };
    }
  }

  const poisonTargetId = night.witchPoisonTargetId;
  if (poisonTargetId) {
    const target = next.players.find((p) => p.id === poisonTargetId);
    if (target?.alive) {
      const res = killPlayer(next, poisonTargetId, 'WITCH_POISON');
      next = res.state;
      hunterIds = hunterIds.concat(res.hunterIds);
      next = { ...next, lastCycleDeaths: [...next.lastCycleDeaths, ...res.deadPlayerIds] };
    }
  }

  next = pushHistory(next, 'NIGHT_DEATH', summarizeDeaths(next, next.lastCycleDeaths));
  next = queueNarration(next, deathNarration(next, next.lastCycleDeaths));

  if (hunterIds.length > 0) {
    return {
      ...next,
      phase: 'HUNTER_RESOLUTION',
      hunter: { hunterId: hunterIds[0]!, reason: 'WOLVES', next: 'DAY_ANNOUNCEMENT' },
    };
  }

  return finalizeToDayAnnouncement(next);
}

function finalizeToDayAnnouncement(state: GameState): GameState {
  const victory = checkVictory(state);
  if (victory) return applyVictory(state, victory);
  let next: GameState = { ...state, phase: 'DAY_ANNOUNCEMENT', dayNumber: state.dayNumber + 1, night: null };
  next = pushHistory(next, 'DAY_STARTED', `Jour ${next.dayNumber}.`);
  next = queueNarration(next, NARRATION.dayBreaks(next.dayNumber), 'high');
  return next;
}

function summarizeDeaths(state: GameState, deadIds: string[]): string {
  if (deadIds.length === 0) return "Aucune mort cette nuit.";
  const names = deadIds.map((id) => findPlayer(state, id).name);
  return `Morts de la nuit : ${names.join(', ')}.`;
}

function deathNarration(state: GameState, deadIds: string[]): string {
  if (deadIds.length === 0) return NARRATION.noOneDied();
  const names = deadIds.map((id) => findPlayer(state, id).name);
  return NARRATION.someoneDied(names);
}

function handleEndDiscussion(state: GameState): GameState {
  if (state.phase !== 'DISCUSSION') return state;
  const vote = startVote(state);
  let next: GameState = {
    ...state,
    phase: 'VOTE',
    vote,
    lastCycleDeaths: [],
    special: { ...state.special, boucEmissaireAllowedVoters: null },
  };
  next = queueNarration(next, NARRATION.voteStart(), 'high');
  return next;
}

function handleCastVote(state: GameState, voterId: string, targetId: string | 'ABSTAIN'): GameState {
  if (state.phase !== 'VOTE' || !state.vote) return state;
  // Protection contre les doubles clics / dispatchs hors-ordre : seul le votant
  // dont c'est le tour peut voter, et il ne peut pas voter deux fois.
  if (state.vote.voterOrder[state.vote.voterIndex] !== voterId) return state;
  let vote = castVote(state.vote, voterId, targetId);
  let next: GameState = { ...state, vote };

  if (!isVoteRoundComplete(vote)) {
    return next;
  }

  vote = resolveVoteRound(next, vote);
  next = { ...next, vote };

  if (!isVoteFinal(vote)) {
    next = queueNarration(next, NARRATION.voteTie(), 'high');
    return next;
  }

  return resolveVoteOutcome(next);
}

function resolveVoteOutcome(state: GameState): GameState {
  const vote = state.vote!;
  let next = state;

  if (vote.noElimination) {
    next = queueNarration(next, NARRATION.voteTieNoResult(), 'high');
    return { ...next, phase: 'VOTE_RESULT' };
  }

  const targetId = vote.eliminatedId!;
  const target = findPlayer(next, targetId);
  const wasScapegoat = vote.wasTieBrokenByScapegoat;

  const res = killPlayer(next, targetId, 'VOTE');
  next = res.state;
  next = { ...next, lastCycleDeaths: [...next.lastCycleDeaths, ...res.deadPlayerIds] };

  if (!res.actuallyDied && target.roleId === 'IDIOT_DU_VILLAGE') {
    next = queueNarration(next, NARRATION.idiotSpared(target.name), 'high');
    return { ...next, phase: 'VOTE_RESULT' };
  }

  if (wasScapegoat) {
    next = queueNarration(next, NARRATION.scapegoatEliminated(target.name), 'high');
  } else {
    const revealedRole = next.config.options.revealRoleOnDeath ? roleName(target.roleId) : undefined;
    next = queueNarration(next, NARRATION.voteResultElimination(target.name, revealedRole), 'high');
  }

  if (target.roleId === 'ANCIEN' && next.special.ancienPowersLost) {
    next = queueNarration(next, NARRATION.ancienVotedOut(), 'high');
  }

  const afterInteractiveSteps: GameState['phase'] = wasScapegoat ? 'SCAPEGOAT_CHOICE' : 'VOTE_RESULT';

  if (res.hunterIds.length > 0) {
    return {
      ...next,
      phase: 'HUNTER_RESOLUTION',
      hunter: { hunterId: res.hunterIds[0]!, reason: 'VOTE', next: afterInteractiveSteps },
    };
  }

  if (wasScapegoat) {
    return { ...next, phase: 'SCAPEGOAT_CHOICE' };
  }

  const victory = checkVictory(next);
  if (victory) return applyVictory(next, victory);

  return { ...next, phase: 'VOTE_RESULT' };
}

function handleScapegoatChoice(state: GameState, voterIds: string[]): GameState {
  if (state.phase !== 'SCAPEGOAT_CHOICE') return state;
  let next: GameState = {
    ...state,
    special: { ...state.special, boucEmissaireAllowedVoters: voterIds.length > 0 ? voterIds : null },
  };
  const victory = checkVictory(next);
  if (victory) return applyVictory(next, victory);
  return { ...next, phase: 'VOTE_RESULT' };
}

function handleHunterShoot(state: GameState, targetId: string): GameState {
  if (state.phase !== 'HUNTER_RESOLUTION' || !state.hunter) return state;
  const hunter = findPlayer(state, state.hunter.hunterId);
  let next: GameState = queueNarration(state, NARRATION.hunterDies(hunter.name));
  const res = killPlayer(next, targetId, 'HUNTER');
  next = res.state;
  next = { ...next, lastCycleDeaths: [...next.lastCycleDeaths, ...res.deadPlayerIds] };
  next = pushHistory(next, 'HUNTER_SHOT', `${hunter.name} (Chasseur) abat ${findPlayer(state, targetId).name}.`);

  const victory = checkVictory(next);
  if (victory) return applyVictory(next, victory);

  const returnPhase = state.hunter.next;
  next = { ...next, hunter: null };
  if (returnPhase === 'DAY_ANNOUNCEMENT') {
    return finalizeToDayAnnouncement(next);
  }
  return { ...next, phase: returnPhase };
}

function applyVictory(state: GameState, victory: VictoryResult): GameState {
  let next: GameState = { ...state, phase: 'GAME_OVER', victory, night: null, vote: null, hunter: null };
  next = pushHistory(next, 'GAME_OVER', victory.message);
  next = queueNarration(next, NARRATION.victory(victory.message), 'high');
  return next;
}

function handleContinueAfterResult(state: GameState): GameState {
  if (state.phase === 'DAY_ANNOUNCEMENT') {
    return { ...state, phase: 'DISCUSSION' };
  }
  if (state.phase === 'VOTE_RESULT') {
    return beginNight({ ...state, vote: null });
  }
  return state;
}

export function totalConfiguredRoles(config: GameConfig): number {
  return totalRoleCount(config.roleCounts);
}
