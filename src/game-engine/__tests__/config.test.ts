import { describe, expect, it } from 'vitest';
import { validateGameConfig, validatePlayerNames, createDefaultConfig, maxWolvesFor } from '../config';

describe('validateGameConfig', () => {
  it('accepte une configuration cohérente', () => {
    const config = createDefaultConfig(8);
    const result = validateGameConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('refuse un nombre de rôles différent du nombre de joueurs', () => {
    const config = createDefaultConfig(8);
    config.roleCounts.VILLAGEOIS = (config.roleCounts.VILLAGEOIS ?? 0) + 1;
    const result = validateGameConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('doit être égal au nombre de joueurs'))).toBe(true);
  });

  it("refuse l'absence de Loup-Garou", () => {
    const config = createDefaultConfig(8);
    const total = config.roleCounts.LOUP_GAROU ?? 0;
    config.roleCounts.VILLAGEOIS = (config.roleCounts.VILLAGEOIS ?? 0) + total;
    config.roleCounts.LOUP_GAROU = 0;
    const result = validateGameConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('au moins un Loup-Garou'))).toBe(true);
  });

  it('refuse trop de Loups-Garous (le Village doit rester majoritaire)', () => {
    const config = createDefaultConfig(8);
    const max = maxWolvesFor(8);
    config.roleCounts.LOUP_GAROU = max + 1;
    config.roleCounts.VILLAGEOIS = 8 - (max + 1);
    const result = validateGameConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Trop de Loups-Garous'))).toBe(true);
  });

  it('refuse un rôle unique en double exemplaire', () => {
    const config = createDefaultConfig(8);
    config.roleCounts.VOYANTE = 2;
    config.roleCounts.VILLAGEOIS = Math.max(0, (config.roleCounts.VILLAGEOIS ?? 0) - 1);
    const result = validateGameConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('une seule fois'))).toBe(true);
  });

  it('refuse un rôle nécessitant plus de joueurs que présents (Voleur)', () => {
    const config = createDefaultConfig(5);
    config.roleCounts.VOLEUR = 1;
    config.roleCounts.VILLAGEOIS = Math.max(0, (config.roleCounts.VILLAGEOIS ?? 0) - 1);
    // 5 joueurs est le minimum pile pour le Voleur, donc on redescend artificiellement à 4 pour le test.
    config.playerCount = 4;
    const result = validateGameConfig(config);
    expect(result.valid).toBe(false);
  });

  it('refuse un nombre de joueurs hors bornes', () => {
    const config = createDefaultConfig(8);
    config.playerCount = 2;
    const result = validateGameConfig(config);
    expect(result.valid).toBe(false);
  });

  it('la répartition par défaut est toujours valide pour 5 à 20 joueurs', () => {
    for (let n = 5; n <= 20; n++) {
      const config = createDefaultConfig(n);
      const result = validateGameConfig(config);
      expect(result.valid, `n=${n}: ${result.errors.join(' | ')}`).toBe(true);
    }
  });
});

describe('validatePlayerNames', () => {
  it('accepte des prénoms uniques', () => {
    const result = validatePlayerNames(['Thomas', 'Lucas', 'Sarah'], 3);
    expect(result.valid).toBe(true);
  });

  it('refuse un prénom vide', () => {
    const result = validatePlayerNames(['Thomas', '', 'Sarah'], 3);
    expect(result.valid).toBe(false);
  });

  it('refuse des prénoms dupliqués', () => {
    const result = validatePlayerNames(['Thomas', 'thomas', 'Sarah'], 3);
    expect(result.valid).toBe(false);
  });

  it('refuse un nombre de prénoms incorrect', () => {
    const result = validatePlayerNames(['Thomas', 'Lucas'], 3);
    expect(result.valid).toBe(false);
  });
});
