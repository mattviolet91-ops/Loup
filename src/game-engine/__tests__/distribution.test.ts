import { describe, expect, it } from 'vitest';
import { createInitialState } from '../engine';
import { createDefaultConfig } from '../config';

describe('distribution des rôles', () => {
  it('distribue exactement un rôle par joueur', () => {
    const config = createDefaultConfig(10);
    const state = createInitialState(config, Array.from({ length: 10 }, (_, i) => `Joueur ${i + 1}`));
    expect(state.players).toHaveLength(10);
    const roleIds = state.players.map((p) => p.roleId);
    expect(new Set(roleIds).size).toBeGreaterThan(0);
  });

  it('respecte la configuration exacte des rôles (compte par rôle)', () => {
    const config = createDefaultConfig(12);
    config.roleCounts = { LOUP_GAROU: 3, VOYANTE: 1, SORCIERE: 1, CHASSEUR: 1, VILLAGEOIS: 6 };
    const state = createInitialState(config, Array.from({ length: 12 }, (_, i) => `J${i + 1}`));
    const counts: Record<string, number> = {};
    for (const p of state.players) counts[p.roleId] = (counts[p.roleId] ?? 0) + 1;
    expect(counts).toEqual({ LOUP_GAROU: 3, VOYANTE: 1, SORCIERE: 1, CHASSEUR: 1, VILLAGEOIS: 6 });
  });

  it('ajoute deux cartes supplémentaires non distribuées quand le Voleur est en jeu', () => {
    const config = createDefaultConfig(6);
    config.roleCounts = { LOUP_GAROU: 1, VOLEUR: 1, VILLAGEOIS: 4 };
    const state = createInitialState(config, Array.from({ length: 6 }, (_, i) => `J${i + 1}`));
    expect(state.players).toHaveLength(6);
    expect(state.special.voleurExtraRoles).toHaveLength(2);
  });

  it('le mélange est différent avec une graine différente (non déterministe par défaut)', () => {
    const config = createDefaultConfig(10);
    const names = Array.from({ length: 10 }, (_, i) => `J${i + 1}`);
    const a = createInitialState(config, names, 1);
    const b = createInitialState(config, names, 2);
    const rolesA = a.players.map((p) => p.roleId).join(',');
    const rolesB = b.players.map((p) => p.roleId).join(',');
    expect(rolesA).not.toEqual(rolesB);
  });

  it('le mélange est reproductible avec la même graine', () => {
    const config = createDefaultConfig(10);
    const names = Array.from({ length: 10 }, (_, i) => `J${i + 1}`);
    const a = createInitialState(config, names, 7);
    const b = createInitialState(config, names, 7);
    expect(a.players.map((p) => p.roleId)).toEqual(b.players.map((p) => p.roleId));
  });

  it('rejette une configuration invalide', () => {
    const config = createDefaultConfig(8);
    config.roleCounts.LOUP_GAROU = 0;
    expect(() => createInitialState(config, Array.from({ length: 8 }, (_, i) => `J${i + 1}`))).toThrow();
  });
});
