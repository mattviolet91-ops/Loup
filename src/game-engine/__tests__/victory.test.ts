import { describe, expect, it } from 'vitest';
import { checkVictory } from '../victorySystem';
import { createDefaultConfig } from '../config';
import type { GameState, Player, RoleId, SpecialState } from '../types';

function makePlayer(id: string, roleId: RoleId, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: id,
    roleId,
    startingRoleId: roleId,
    alive: true,
    charmed: false,
    powersDisabled: false,
    canVote: true,
    revealedAsIdiot: false,
    ancienExtraLifeUsed: false,
    hasSeenRole: true,
    ...overrides,
  };
}

function makeState(players: Player[], special: Partial<SpecialState> = {}): GameState {
  return {
    phase: 'DAY_ANNOUNCEMENT',
    config: createDefaultConfig(players.length >= 5 ? players.length : 5),
    players,
    dayNumber: 1,
    nightNumber: 1,
    history: [],
    narrationQueue: [],
    night: null,
    vote: null,
    hunter: null,
    roleReveal: null,
    victory: null,
    special: {
      witchHealUsed: false,
      witchPoisonUsed: false,
      cupidLoverIds: null,
      salvateurLastProtectedId: null,
      voleurExtraRoles: [],
      voleurHasActed: false,
      piperCharmedIds: [],
      boucEmissaireAllowedVoters: null,
      ancienPowersLost: false,
      ...special,
    },
    rngSeed: 1,
    lastCycleDeaths: [],
  };
}

describe('checkVictory', () => {
  it('victoire du Village quand tous les Loups-Garous sont morts', () => {
    const players = [
      makePlayer('a', 'VILLAGEOIS'),
      makePlayer('b', 'VILLAGEOIS'),
      makePlayer('c', 'LOUP_GAROU', { alive: false }),
    ];
    const result = checkVictory(makeState(players));
    expect(result?.winner).toBe('VILLAGE');
  });

  it('victoire des Loups-Garous quand ils sont à parité avec le reste', () => {
    const players = [makePlayer('a', 'VILLAGEOIS'), makePlayer('b', 'LOUP_GAROU')];
    const result = checkVictory(makeState(players));
    expect(result?.winner).toBe('WEREWOLVES');
  });

  it('la partie continue si le Village est encore majoritaire', () => {
    const players = [makePlayer('a', 'VILLAGEOIS'), makePlayer('b', 'VILLAGEOIS'), makePlayer('c', 'LOUP_GAROU')];
    const result = checkVictory(makeState(players));
    expect(result).toBeNull();
  });

  it('victoire des Amoureux quand ils sont les deux derniers survivants', () => {
    const players = [
      makePlayer('a', 'VILLAGEOIS'),
      makePlayer('b', 'LOUP_GAROU'),
      makePlayer('c', 'VILLAGEOIS', { alive: false }),
    ];
    const result = checkVictory(makeState(players, { cupidLoverIds: ['a', 'b'] }));
    expect(result?.winner).toBe('LOVERS');
    expect(result?.winningPlayerIds.sort()).toEqual(['a', 'b']);
  });

  it("victoire du Joueur de Flûte quand tout le monde est charmé", () => {
    const players = [
      makePlayer('a', 'JOUEUR_DE_FLUTE'),
      makePlayer('b', 'VILLAGEOIS', { charmed: true }),
      makePlayer('c', 'LOUP_GAROU', { charmed: true }),
    ];
    const config = createDefaultConfig(8);
    config.roleCounts = { JOUEUR_DE_FLUTE: 1, LOUP_GAROU: 1, VILLAGEOIS: 1 };
    const state = { ...makeState(players), config };
    const result = checkVictory(state);
    expect(result?.winner).toBe('JOUEUR_DE_FLUTE');
  });

  it('le Joueur de Flûte ne gagne pas tant que tout le monde n\'est pas charmé', () => {
    const players = [
      makePlayer('a', 'JOUEUR_DE_FLUTE'),
      makePlayer('b', 'VILLAGEOIS', { charmed: true }),
      makePlayer('c', 'LOUP_GAROU', { charmed: false }),
    ];
    const config = createDefaultConfig(8);
    config.roleCounts = { JOUEUR_DE_FLUTE: 1, LOUP_GAROU: 1, VILLAGEOIS: 1 };
    const state = { ...makeState(players), config };
    const result = checkVictory(state);
    expect(result?.winner).not.toBe('JOUEUR_DE_FLUTE');
  });
});
