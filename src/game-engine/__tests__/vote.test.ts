import { describe, expect, it } from 'vitest';
import { buildTestGame, skipRoleReveal, playerId, step } from './testUtils';
import type { GameState } from '../types';

/** Fait dévorer par les loups le premier villageois vivant (dans l'ordre des joueurs), sans autre rôle actif. */
function resolveTrivialNight(state: GameState, exclude: string[] = []): GameState {
  let next = state;
  while (next.phase === 'NIGHT') {
    const wolves = next.players.filter((p) => p.roleId === 'LOUP_GAROU' && p.alive);
    const victim = next.players.find((p) => p.roleId !== 'LOUP_GAROU' && p.alive && !exclude.includes(p.id))!;
    for (const wolf of wolves) {
      if (next.phase !== 'NIGHT') break;
      next = step(next, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: wolf.id, targetId: victim.id } });
    }
  }
  return next;
}

function toDiscussion(state: GameState, exclude: string[] = []): GameState {
  let next = resolveTrivialNight(skipRoleReveal(state), exclude);
  if (next.phase === 'DAY_ANNOUNCEMENT') {
    next = step(next, { type: 'START_DISCUSSION' });
  }
  return next;
}

function startVotePhase(state: GameState, exclude: string[] = []): GameState {
  const discussion = toDiscussion(state, exclude);
  return step(discussion, { type: 'END_DISCUSSION' });
}

describe('vote de jour', () => {
  it('élimine le joueur qui obtient la majorité des voix', () => {
    const names = ['Thomas', 'Lucas', 'Sarah', 'Paul', 'Julie'];
    let state = buildTestGame(names, ['LOUP_GAROU', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS']);
    state = startVotePhase(state);
    expect(state.phase).toBe('VOTE');

    // Lucas a été dévoré cette nuit (premier villageois de la liste) : on élimine Sarah, toujours vivante.
    const sarahId = playerId(state, 'Sarah');
    const voters = state.vote!.voterOrder;
    for (const voterId of voters) {
      state = step(state, { type: 'CAST_VOTE', voterId, targetId: sarahId });
    }

    expect(state.phase).toBe('VOTE_RESULT');
    const sarah = state.players.find((p) => p.id === sarahId)!;
    expect(sarah.alive).toBe(false);
    expect(sarah.deathCause).toBe('VOTE');
  });

  it("organise un second tour en cas d'égalité, puis ne fait aucune victime en cas d'égalité persistante", () => {
    const names = ['Thomas', 'Marc', 'Lucas', 'Sarah', 'Paul'];
    let state = buildTestGame(names, ['LOUP_GAROU', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS']);
    // Marc sert de "victime" de nuit pour laisser Thomas, Lucas, Sarah et Paul votants.
    state = startVotePhase(state);

    const thomasId = playerId(state, 'Thomas');
    const lucasId = playerId(state, 'Lucas');
    const sarahId = playerId(state, 'Sarah');
    const paulId = playerId(state, 'Paul');
    expect(state.vote!.voterOrder.sort()).toEqual([thomasId, lucasId, sarahId, paulId].sort());

    // Thomas et Lucas votent Sarah, Sarah et Paul votent Thomas => égalité 2/2.
    state = step(state, { type: 'CAST_VOTE', voterId: thomasId, targetId: sarahId });
    state = step(state, { type: 'CAST_VOTE', voterId: lucasId, targetId: sarahId });
    state = step(state, { type: 'CAST_VOTE', voterId: sarahId, targetId: thomasId });
    state = step(state, { type: 'CAST_VOTE', voterId: paulId, targetId: thomasId });

    expect(state.phase).toBe('VOTE');
    expect(state.vote!.round).toBe(2);
    expect(state.vote!.candidateIds.sort()).toEqual([sarahId, thomasId].sort());

    // Second tour : encore égalité => personne n'est éliminé.
    state = step(state, { type: 'CAST_VOTE', voterId: thomasId, targetId: sarahId });
    state = step(state, { type: 'CAST_VOTE', voterId: lucasId, targetId: sarahId });
    state = step(state, { type: 'CAST_VOTE', voterId: sarahId, targetId: thomasId });
    state = step(state, { type: 'CAST_VOTE', voterId: paulId, targetId: thomasId });

    expect(state.phase).toBe('VOTE_RESULT');
    expect(state.vote!.noElimination).toBe(true);
    expect(state.players.filter((p) => p.id !== playerId(state, 'Marc')).every((p) => p.alive)).toBe(true);
  });

  it("élimine le Bouc Émissaire en cas d'égalité, qui choisit ensuite les votants du tour suivant", () => {
    const names = ['Thomas', 'Ines', 'Lucas', 'Sarah', 'Paul', 'Julie', 'Marc', 'Nina'];
    let state = buildTestGame(names, [
      'LOUP_GAROU',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'BOUC_EMISSAIRE',
    ]);
    // Ines sert de victime de nuit ; Lucas, Sarah, Paul, Julie, Marc et Nina (Bouc) participent au vote.
    state = startVotePhase(state);

    const ids = Object.fromEntries(names.map((n) => [n, playerId(state, n)]));

    // Thomas & Lucas votent Sarah, Sarah & Paul votent Marc => égalité, Julie/Marc/Nina s'abstiennent.
    state = step(state, { type: 'CAST_VOTE', voterId: ids.Thomas!, targetId: ids.Sarah! });
    state = step(state, { type: 'CAST_VOTE', voterId: ids.Lucas!, targetId: ids.Sarah! });
    state = step(state, { type: 'CAST_VOTE', voterId: ids.Sarah!, targetId: ids.Marc! });
    state = step(state, { type: 'CAST_VOTE', voterId: ids.Paul!, targetId: ids.Marc! });
    state = step(state, { type: 'CAST_VOTE', voterId: ids.Julie!, targetId: 'ABSTAIN' });
    state = step(state, { type: 'CAST_VOTE', voterId: ids.Marc!, targetId: 'ABSTAIN' });
    state = step(state, { type: 'CAST_VOTE', voterId: ids.Nina!, targetId: 'ABSTAIN' });

    expect(state.phase).toBe('SCAPEGOAT_CHOICE');
    const nina = state.players.find((p) => p.id === ids.Nina)!;
    expect(nina.alive).toBe(false);
    expect(nina.deathCause).toBe('VOTE');

    state = step(state, { type: 'SCAPEGOAT_CHOOSE_VOTERS', voterIds: [ids.Thomas!, ids.Lucas!] });
    expect(state.phase).toBe('VOTE_RESULT');

    state = step(state, { type: 'CONTINUE_AFTER_RESULT' });
    // Nuit suivante : les loups épargnent Thomas et Lucas (futurs votants restreints).
    state = resolveTrivialNight(state, [ids.Thomas!, ids.Lucas!]);
    state = step(state, { type: 'START_DISCUSSION' });
    state = step(state, { type: 'END_DISCUSSION' });
    expect(state.vote!.eligibleVoterIds.sort()).toEqual([ids.Thomas!, ids.Lucas!].sort());
  });
});
