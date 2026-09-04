import { describe, expect, it } from 'vitest';
import { buildTestGame, skipRoleReveal, playerId, step } from './testUtils';
import { nextFloat } from '../rng';
import { currentNightStepKind } from '../nightOrder';

describe('Voyante', () => {
  it('découvre le rôle exact de la cible', () => {
    const names = ['Thomas', 'Lucas', 'Sarah', 'Paul', 'Julie', 'Marc'];
    let state = buildTestGame(names, ['LOUP_GAROU', 'VOYANTE', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS']);
    state = skipRoleReveal(state);
    expect(currentNightStepKind(state)).toBe('VOYANTE');

    const thomasId = playerId(state, 'Thomas');
    const lucasId = playerId(state, 'Lucas');
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'VOYANTE', targetId: thomasId } });
    expect(state.night!.seerResult).toEqual({ targetId: thomasId, roleId: 'LOUP_GAROU' });

    state = step(state, { type: 'NIGHT_ACK' });
    expect(state.night!.seerResult).toBeNull();
    expect(currentNightStepKind(state)).toBe('LOUP_GAROU');

    const sarahId = playerId(state, 'Sarah');
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: thomasId, targetId: sarahId } });
    expect(state.phase).toBe('DAY_ANNOUNCEMENT');
    void lucasId;
  });
});

describe('Sorcière', () => {
  it('peut utiliser la potion de vie et la potion de mort la même nuit', () => {
    const names = ['Thomas', 'Lucas', 'Sarah', 'Paul', 'Julie', 'Marc'];
    let state = buildTestGame(names, ['LOUP_GAROU', 'SORCIERE', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS']);
    state = skipRoleReveal(state);
    const thomasId = playerId(state, 'Thomas');
    const sarahId = playerId(state, 'Sarah');
    const paulId = playerId(state, 'Paul');

    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: thomasId, targetId: sarahId } });
    expect(currentNightStepKind(state)).toBe('SORCIERE');

    state = step(state, {
      type: 'NIGHT_ACTION',
      payload: { kind: 'SORCIERE', heal: true, poisonTargetId: paulId },
    });

    expect(state.phase).toBe('DAY_ANNOUNCEMENT');
    const sarah = state.players.find((p) => p.id === sarahId)!;
    const paul = state.players.find((p) => p.id === paulId)!;
    expect(sarah.alive).toBe(true);
    expect(paul.alive).toBe(false);
    expect(paul.deathCause).toBe('WITCH_POISON');
  });

  it('ne peut pas réutiliser une potion déjà consommée', () => {
    const names = ['Thomas', 'Lucas', 'Sarah', 'Paul', 'Julie', 'Marc'];
    let state = buildTestGame(names, ['LOUP_GAROU', 'SORCIERE', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS']);
    state = skipRoleReveal(state);
    const thomasId = playerId(state, 'Thomas');
    const sarahId = playerId(state, 'Sarah');

    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: thomasId, targetId: sarahId } });
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'SORCIERE', heal: true, poisonTargetId: null } });
    expect(state.special.witchHealUsed).toBe(true);
    expect(state.special.witchPoisonUsed).toBe(false);

    // Nuit suivante : la sorcière ne devrait plus pouvoir soigner (potion épuisée), seule la potion de mort reste.
    state = step(state, { type: 'START_DISCUSSION' });
    state = step(state, { type: 'END_DISCUSSION' });
    for (const voterId of state.vote!.voterOrder) {
      state = step(state, { type: 'CAST_VOTE', voterId, targetId: 'ABSTAIN' });
    }
    state = step(state, { type: 'CONTINUE_AFTER_RESULT' });
    const thomasId2 = playerId(state, 'Thomas');
    const paulId = playerId(state, 'Paul');
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: thomasId2, targetId: paulId } });
    expect(currentNightStepKind(state)).toBe('SORCIERE');
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'SORCIERE', heal: true, poisonTargetId: null } });
    // Le "heal" ne devait plus être consommable : Paul doit bien mourir.
    const paul = state.players.find((p) => p.id === paulId)!;
    expect(paul.alive).toBe(false);
  });
});

describe('Cupidon et Amoureux', () => {
  it("forme les Amoureux et déclenche la mort de chagrin", () => {
    const names = ['Thomas', 'Lucas', 'Sarah', 'Paul', 'Julie'];
    let state = buildTestGame(names, ['LOUP_GAROU', 'CUPIDON', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS']);
    state = skipRoleReveal(state);
    expect(currentNightStepKind(state)).toBe('CUPIDON');

    const sarahId = playerId(state, 'Sarah');
    const paulId = playerId(state, 'Paul');
    const thomasId = playerId(state, 'Thomas');

    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'CUPIDON', targetIds: [sarahId, paulId] } });
    expect(state.special.cupidLoverIds).toEqual([sarahId, paulId]);
    expect(currentNightStepKind(state)).toBe('LOVERS_REVEAL');

    state = step(state, { type: 'NIGHT_ACK' });
    expect(currentNightStepKind(state)).toBe('LOUP_GAROU');

    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: thomasId, targetId: sarahId } });

    const sarah = state.players.find((p) => p.id === sarahId)!;
    const paul = state.players.find((p) => p.id === paulId)!;
    expect(sarah.alive).toBe(false);
    expect(paul.alive).toBe(false);
    expect(paul.deathCause).toBe('LOVER_GRIEF');
  });
});

describe('Chasseur', () => {
  it('abat immédiatement un joueur en mourant', () => {
    const names = ['Thomas', 'Lucas', 'Sarah', 'Paul', 'Julie', 'Marc', 'Nina'];
    let state = buildTestGame(names, [
      'LOUP_GAROU',
      'CHASSEUR',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
    ]);
    state = skipRoleReveal(state);
    const thomasId = playerId(state, 'Thomas');
    const julieId = playerId(state, 'Julie');
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: thomasId, targetId: julieId } });
    state = step(state, { type: 'START_DISCUSSION' });
    state = step(state, { type: 'END_DISCUSSION' });

    const lucasId = playerId(state, 'Lucas');
    for (const voterId of state.vote!.voterOrder) {
      state = step(state, { type: 'CAST_VOTE', voterId, targetId: lucasId });
    }

    expect(state.phase).toBe('HUNTER_RESOLUTION');
    expect(state.hunter!.hunterId).toBe(lucasId);

    const sarahId = playerId(state, 'Sarah');
    state = step(state, { type: 'HUNTER_SHOOT', targetId: sarahId });

    expect(state.phase).toBe('VOTE_RESULT');
    const sarah = state.players.find((p) => p.id === sarahId)!;
    expect(sarah.alive).toBe(false);
    expect(sarah.deathCause).toBe('HUNTER');
  });
});

describe('Ancien', () => {
  it('survit à la première attaque des Loups-Garous mais pas à la seconde', () => {
    const names = ['Thomas', 'Lucas', 'Sarah', 'Paul', 'Julie', 'Marc', 'Nina'];
    let state = buildTestGame(names, [
      'LOUP_GAROU',
      'ANCIEN',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
    ]);
    state = skipRoleReveal(state);
    const thomasId = playerId(state, 'Thomas');
    const lucasId = playerId(state, 'Lucas');

    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: thomasId, targetId: lucasId } });
    let lucas = state.players.find((p) => p.id === lucasId)!;
    expect(lucas.alive).toBe(true);
    expect(lucas.ancienExtraLifeUsed).toBe(true);
    expect(state.lastCycleDeaths).not.toContain(lucasId);

    state = step(state, { type: 'START_DISCUSSION' });
    state = step(state, { type: 'END_DISCUSSION' });
    for (const voterId of state.vote!.voterOrder) {
      state = step(state, { type: 'CAST_VOTE', voterId, targetId: 'ABSTAIN' });
    }
    state = step(state, { type: 'CONTINUE_AFTER_RESULT' });

    const thomasId2 = playerId(state, 'Thomas');
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: thomasId2, targetId: lucasId } });
    lucas = state.players.find((p) => p.id === lucasId)!;
    expect(lucas.alive).toBe(false);
    expect(lucas.deathCause).toBe('WOLVES');
  });

  it('fait perdre leurs pouvoirs aux villageois si le village le vote par erreur', () => {
    const names = ['Thomas', 'Lucas', 'Sarah', 'Paul', 'Julie', 'Marc', 'Nina', 'Ines'];
    let state = buildTestGame(names, [
      'LOUP_GAROU',
      'ANCIEN',
      'VOYANTE',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
    ]);
    state = skipRoleReveal(state);
    const thomasId = playerId(state, 'Thomas');
    const paulId = playerId(state, 'Paul');
    const lucasId = playerId(state, 'Lucas');
    const sarahId = playerId(state, 'Sarah');

    expect(currentNightStepKind(state)).toBe('VOYANTE');
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'VOYANTE', targetId: paulId } });
    state = step(state, { type: 'NIGHT_ACK' });
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: thomasId, targetId: paulId } });
    state = step(state, { type: 'START_DISCUSSION' });
    state = step(state, { type: 'END_DISCUSSION' });

    for (const voterId of state.vote!.voterOrder) {
      state = step(state, { type: 'CAST_VOTE', voterId, targetId: lucasId });
    }

    const lucas = state.players.find((p) => p.id === lucasId)!;
    expect(lucas.alive).toBe(false);
    expect(state.special.ancienPowersLost).toBe(true);
    const sarah = state.players.find((p) => p.id === sarahId)!;
    expect(sarah.powersDisabled).toBe(true);

    state = step(state, { type: 'CONTINUE_AFTER_RESULT' });
    // La Voyante ayant perdu son pouvoir, son étape de nuit doit être sautée.
    expect(currentNightStepKind(state)).not.toBe('VOYANTE');
  });
});

describe('Idiot du Village', () => {
  it('survit une première fois au vote puis perd le droit de voter, mais peut mourir au vote suivant', () => {
    const names = ['Thomas', 'Lucas', 'Sarah', 'Paul', 'Julie', 'Marc', 'Nina'];
    let state = buildTestGame(names, [
      'LOUP_GAROU',
      'IDIOT_DU_VILLAGE',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
    ]);
    state = skipRoleReveal(state);
    const thomasId = playerId(state, 'Thomas');
    const lucasId = playerId(state, 'Lucas');
    const sarahId = playerId(state, 'Sarah');

    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: thomasId, targetId: sarahId } });
    state = step(state, { type: 'START_DISCUSSION' });
    state = step(state, { type: 'END_DISCUSSION' });
    for (const voterId of state.vote!.voterOrder) {
      state = step(state, { type: 'CAST_VOTE', voterId, targetId: lucasId });
    }

    let lucas = state.players.find((p) => p.id === lucasId)!;
    expect(lucas.alive).toBe(true);
    expect(lucas.revealedAsIdiot).toBe(true);
    expect(lucas.canVote).toBe(false);

    state = step(state, { type: 'CONTINUE_AFTER_RESULT' });
    expect(state.vote).toBeNull();
    const thomasId2 = playerId(state, 'Thomas');
    const paulId = playerId(state, 'Paul');
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: thomasId2, targetId: paulId } });
    state = step(state, { type: 'START_DISCUSSION' });
    state = step(state, { type: 'END_DISCUSSION' });

    expect(state.vote!.eligibleVoterIds).not.toContain(lucasId);
    for (const voterId of state.vote!.voterOrder) {
      state = step(state, { type: 'CAST_VOTE', voterId, targetId: lucasId });
    }
    lucas = state.players.find((p) => p.id === lucasId)!;
    expect(lucas.alive).toBe(false);
    expect(lucas.deathCause).toBe('VOTE');
  });
});

describe('Salvateur', () => {
  it('protège sa cible contre l\'attaque des Loups-Garous', () => {
    const names = ['Thomas', 'Lucas', 'Sarah', 'Paul', 'Julie', 'Marc'];
    let state = buildTestGame(names, ['LOUP_GAROU', 'SALVATEUR', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS']);
    state = skipRoleReveal(state);
    expect(currentNightStepKind(state)).toBe('SALVATEUR');

    const sarahId = playerId(state, 'Sarah');
    const thomasId = playerId(state, 'Thomas');
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'SALVATEUR', targetId: sarahId } });
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: thomasId, targetId: sarahId } });

    expect(state.phase).toBe('DAY_ANNOUNCEMENT');
    const sarah = state.players.find((p) => p.id === sarahId)!;
    expect(sarah.alive).toBe(true);
    expect(state.lastCycleDeaths).toEqual([]);
  });
});

describe('Voleur', () => {
  it("l'échange est obligatoire si les deux cartes restantes sont des Loups-Garous", () => {
    const names = ['Thomas', 'Lucas', 'Sarah', 'Paul', 'Julie', 'Marc'];
    let state = buildTestGame(names, ['LOUP_GAROU', 'VOLEUR', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS']);
    state = skipRoleReveal(state);
    state = { ...state, special: { ...state.special, voleurExtraRoles: ['LOUP_GAROU', 'LOUP_GAROU'] } };
    expect(currentNightStepKind(state)).toBe('VOLEUR');

    const lucasId = playerId(state, 'Lucas');
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'VOLEUR', swapWith: null } });
    const lucas = state.players.find((p) => p.id === lucasId)!;
    expect(lucas.roleId).toBe('LOUP_GAROU');
  });

  it('reste optionnel sinon', () => {
    const names = ['Thomas', 'Lucas', 'Sarah', 'Paul', 'Julie', 'Marc'];
    let state = buildTestGame(names, ['LOUP_GAROU', 'VOLEUR', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS']);
    state = skipRoleReveal(state);
    state = { ...state, special: { ...state.special, voleurExtraRoles: ['VILLAGEOIS', 'VILLAGEOIS'] } };
    const lucasId = playerId(state, 'Lucas');
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'VOLEUR', swapWith: null } });
    const lucas = state.players.find((p) => p.id === lucasId)!;
    expect(lucas.roleId).toBe('VOLEUR');
  });
});

describe('Petite Fille', () => {
  it('devient la victime si elle se fait repérer en espionnant', () => {
    const names = ['Thomas', 'Lucas', 'Sarah', 'Paul', 'Julie', 'Marc'];
    let state = buildTestGame(names, ['LOUP_GAROU', 'PETITE_FILLE', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS', 'VILLAGEOIS']);
    state = skipRoleReveal(state);
    const thomasId = playerId(state, 'Thomas');
    const lucasId = playerId(state, 'Lucas');
    const sarahId = playerId(state, 'Sarah');

    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: thomasId, targetId: sarahId } });
    expect(currentNightStepKind(state)).toBe('PETITE_FILLE');

    const [roll] = nextFloat(state.rngSeed);
    const willBeSpotted = roll < state.config.options.spySpotChance;

    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'PETITE_FILLE', spy: true } });
    expect(state.night!.petiteFilleSpySpotted).toBe(willBeSpotted);
    state = step(state, { type: 'NIGHT_ACK' });

    const lucas = state.players.find((p) => p.id === lucasId)!;
    const sarah = state.players.find((p) => p.id === sarahId)!;
    if (willBeSpotted) {
      expect(lucas.alive).toBe(false);
      expect(lucas.deathCause).toBe('PETITE_FILLE_SPOTTED');
      expect(sarah.alive).toBe(true);
    } else {
      expect(lucas.alive).toBe(true);
      expect(sarah.alive).toBe(false);
    }
  });
});

describe('Joueur de Flûte', () => {
  it('charme deux joueurs par nuit et les libère à sa mort', () => {
    const names = ['Thomas', 'Lucas', 'Sarah', 'Paul', 'Julie', 'Marc', 'Nina', 'Ines'];
    let state = buildTestGame(names, [
      'LOUP_GAROU',
      'JOUEUR_DE_FLUTE',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
    ]);
    state = skipRoleReveal(state);
    const thomasId = playerId(state, 'Thomas');
    const lucasId = playerId(state, 'Lucas');
    const sarahId = playerId(state, 'Sarah');
    const paulId = playerId(state, 'Paul');

    const julieId = playerId(state, 'Julie');
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: thomasId, targetId: julieId } });
    expect(currentNightStepKind(state)).toBe('JOUEUR_DE_FLUTE');
    state = step(state, {
      type: 'NIGHT_ACTION',
      payload: { kind: 'JOUEUR_DE_FLUTE', targetIds: [sarahId, paulId] },
    });

    let sarah = state.players.find((p) => p.id === sarahId)!;
    let paul = state.players.find((p) => p.id === paulId)!;
    expect(sarah.charmed).toBe(true);
    expect(paul.charmed).toBe(true);

    // Le Joueur de Flûte meurt : les charmés sont libérés.
    state = step(state, { type: 'START_DISCUSSION' });
    state = step(state, { type: 'END_DISCUSSION' });
    for (const voterId of state.vote!.voterOrder) {
      state = step(state, { type: 'CAST_VOTE', voterId, targetId: lucasId });
    }

    sarah = state.players.find((p) => p.id === sarahId)!;
    paul = state.players.find((p) => p.id === paulId)!;
    expect(sarah.charmed).toBe(false);
    expect(paul.charmed).toBe(false);
  });
});

describe('Plusieurs Loups-Garous', () => {
  it('la cible ayant le plus de voix des loups est attaquée', () => {
    const names = ['Thomas', 'Lucas', 'Marc', 'Sarah', 'Paul', 'Julie', 'Nina', 'Ines', 'Léo'];
    let state = buildTestGame(names, [
      'LOUP_GAROU',
      'LOUP_GAROU',
      'LOUP_GAROU',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
      'VILLAGEOIS',
    ]);
    state = skipRoleReveal(state);
    const thomasId = playerId(state, 'Thomas');
    const lucasId = playerId(state, 'Lucas');
    const marcId = playerId(state, 'Marc');
    const sarahId = playerId(state, 'Sarah');
    const paulId = playerId(state, 'Paul');

    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: thomasId, targetId: sarahId } });
    expect(state.phase).toBe('NIGHT');
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: lucasId, targetId: sarahId } });
    expect(state.phase).toBe('NIGHT');
    state = step(state, { type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId: marcId, targetId: paulId } });

    expect(state.phase).toBe('DAY_ANNOUNCEMENT');
    const sarah = state.players.find((p) => p.id === sarahId)!;
    const paul = state.players.find((p) => p.id === paulId)!;
    expect(sarah.alive).toBe(false);
    expect(paul.alive).toBe(true);
  });
});
