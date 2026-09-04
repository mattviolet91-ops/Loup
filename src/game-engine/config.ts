import type { GameConfig, GameOptions, RoleCounts, RoleId, ValidationResult } from './types';
import { ROLES, UNIQUE_ROLE_IDS } from './roles';
import { shuffle, type RngState } from './rng';

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 24;

export const DEFAULT_OPTIONS: GameOptions = {
  revealRoleOnDeath: true,
  spySpotChance: 0.2,
  discussionDurationSeconds: 180,
  narrationEnabled: true,
  narrationVolume: 1,
  // Débit légèrement ralenti et voix plus grave : diction de conteur, pas de GPS.
  narrationRate: 0.92,
  narrationPitch: 0.8,
  narrationVoiceURI: null,
  animationsEnabled: true,
  highContrast: false,
};

/** Nombre de joueurs utilisé par le raccourci « partie test ». */
export const TEST_GAME_PLAYER_COUNT = 8;

/**
 * Prénoms générés automatiquement (« Joueur 1 », « Joueur 2 »…) pour essayer
 * l'application sans avoir à saisir de vrais prénoms. Ils respectent les
 * mêmes contraintes que des prénoms saisis à la main : non vides et uniques.
 */
export function generatePlayerNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Joueur ${i + 1}`);
}

/** Répartition par défaut raisonnable pour un nombre de joueurs donné. */
export function defaultRoleCountsFor(playerCount: number): RoleCounts {
  const wolves = Math.max(1, Math.min(maxWolvesFor(playerCount), Math.round(playerCount / 4)));
  const counts: RoleCounts = { LOUP_GAROU: wolves };
  let remaining = playerCount - wolves;

  const specialsInOrder: RoleId[] = ['VOYANTE', 'SORCIERE', 'CHASSEUR', 'CUPIDON'];
  for (const roleId of specialsInOrder) {
    const role = ROLES[roleId];
    if (remaining > 1 && (!role.minPlayers || playerCount >= role.minPlayers)) {
      counts[roleId] = 1;
      remaining -= 1;
    }
  }

  counts.VILLAGEOIS = Math.max(0, remaining);
  return counts;
}

export function maxWolvesFor(playerCount: number): number {
  return Math.max(1, Math.floor((playerCount - 1) / 2));
}

export function totalRoleCount(roleCounts: RoleCounts): number {
  return Object.values(roleCounts).reduce((sum, n) => sum + (n ?? 0), 0);
}

export function createDefaultConfig(playerCount: number): GameConfig {
  return {
    playerCount,
    roleCounts: defaultRoleCountsFor(playerCount),
    options: { ...DEFAULT_OPTIONS },
  };
}

export function validateGameConfig(config: GameConfig): ValidationResult {
  const errors: string[] = [];
  const { playerCount, roleCounts } = config;

  if (!Number.isInteger(playerCount) || playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    errors.push(
      `Le nombre de joueurs doit être un entier compris entre ${MIN_PLAYERS} et ${MAX_PLAYERS} (actuel : ${playerCount}).`,
    );
  }

  for (const [roleId, count] of Object.entries(roleCounts)) {
    if (!(roleId in ROLES)) {
      errors.push(`Rôle inconnu : "${roleId}".`);
      continue;
    }
    if (count == null || count < 0 || !Number.isInteger(count)) {
      errors.push(`Le nombre de "${ROLES[roleId as RoleId].name}" doit être un entier positif ou nul.`);
    }
  }

  for (const roleId of UNIQUE_ROLE_IDS) {
    const count = roleCounts[roleId] ?? 0;
    if (count > 1) {
      errors.push(`Le rôle "${ROLES[roleId].name}" ne peut être présent qu'une seule fois.`);
    }
  }

  const total = totalRoleCount(roleCounts);
  if (Number.isInteger(playerCount) && total !== playerCount) {
    errors.push(
      `Le nombre total de rôles sélectionnés (${total}) doit être égal au nombre de joueurs (${playerCount}).`,
    );
  }

  const wolves = roleCounts.LOUP_GAROU ?? 0;
  if (wolves < 1) {
    errors.push('Il faut au moins un Loup-Garou.');
  }
  if (Number.isInteger(playerCount) && playerCount >= MIN_PLAYERS) {
    const maxWolves = maxWolvesFor(playerCount);
    if (wolves > maxWolves) {
      errors.push(
        `Trop de Loups-Garous : au maximum ${maxWolves} pour ${playerCount} joueurs (le Village doit rester majoritaire).`,
      );
    }
  }

  if (Number.isInteger(playerCount)) {
    for (const [roleId, count] of Object.entries(roleCounts)) {
      if ((count ?? 0) <= 0) continue;
      const role = ROLES[roleId as RoleId];
      if (role?.minPlayers && playerCount < role.minPlayers) {
        errors.push(
          `Le rôle "${role.name}" nécessite au moins ${role.minPlayers} joueurs (actuellement ${playerCount}).`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validatePlayerNames(names: string[], playerCount: number): ValidationResult {
  const errors: string[] = [];
  if (names.length !== playerCount) {
    errors.push(`${playerCount} prénoms attendus, ${names.length} reçus.`);
  }
  const trimmed = names.map((n) => n.trim());
  trimmed.forEach((name, i) => {
    if (name.length === 0) {
      errors.push(`Le prénom du joueur ${i + 1} est vide.`);
    }
    if (name.length > 24) {
      errors.push(`Le prénom "${name}" est trop long (24 caractères maximum).`);
    }
  });
  const seen = new Map<string, number>();
  trimmed.forEach((name) => {
    const key = name.toLocaleLowerCase('fr-FR');
    seen.set(key, (seen.get(key) ?? 0) + 1);
  });
  for (const [name, count] of seen) {
    if (count > 1 && name.length > 0) {
      errors.push(`Le prénom "${name}" est utilisé ${count} fois : chaque joueur doit avoir un prénom unique.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

/** Construit le paquet de rôles (un par joueur) à partir de la configuration. */
export function buildBaseDeck(roleCounts: RoleCounts): RoleId[] {
  const deck: RoleId[] = [];
  for (const [roleId, count] of Object.entries(roleCounts)) {
    for (let i = 0; i < (count ?? 0); i++) {
      deck.push(roleId as RoleId);
    }
  }
  return deck;
}

/**
 * Choisit les 2 cartes supplémentaires du Voleur, pondérées par la
 * composition non-unique de la partie (Villageois / Loup-Garou), avec repli
 * sur deux Villageois si la partie est trop réduite pour construire un pool.
 */
export function pickThiefExtraRoles(roleCounts: RoleCounts, seed: RngState): [RoleId[], RngState] {
  const pool: RoleId[] = [];
  const villageois = roleCounts.VILLAGEOIS ?? 0;
  const loups = roleCounts.LOUP_GAROU ?? 0;
  for (let i = 0; i < villageois; i++) pool.push('VILLAGEOIS');
  for (let i = 0; i < loups; i++) pool.push('LOUP_GAROU');
  if (pool.length < 2) {
    pool.push('VILLAGEOIS', 'VILLAGEOIS');
  }
  const [shuffled, nextSeed] = shuffle(pool, seed);
  return [[shuffled[0]!, shuffled[1]!], nextSeed];
}
