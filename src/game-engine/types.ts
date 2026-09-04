// Types fondamentaux du moteur de jeu. Ce module ne dépend d'aucune librairie
// UI : il peut être testé et réutilisé indépendamment de React.

export type Team = 'VILLAGE' | 'WEREWOLVES' | 'INDEPENDENT';

export type RoleId =
  | 'VILLAGEOIS'
  | 'LOUP_GAROU'
  | 'VOYANTE'
  | 'SORCIERE'
  | 'CHASSEUR'
  | 'CUPIDON'
  | 'PETITE_FILLE'
  | 'VOLEUR'
  | 'SALVATEUR'
  | 'ANCIEN'
  | 'IDIOT_DU_VILLAGE'
  | 'BOUC_EMISSAIRE'
  | 'JOUEUR_DE_FLUTE';

export type DeathCause =
  | 'WOLVES'
  | 'WITCH_POISON'
  | 'VOTE'
  | 'HUNTER'
  | 'LOVER_GRIEF'
  | 'PETITE_FILLE_SPOTTED';

export interface Player {
  id: string;
  name: string;
  roleId: RoleId;
  startingRoleId: RoleId;
  alive: boolean;
  deathCause?: DeathCause;
  diedOnNight?: number;
  diedOnDay?: number;
  charmed: boolean;
  powersDisabled: boolean;
  canVote: boolean;
  revealedAsIdiot: boolean;
  ancienExtraLifeUsed: boolean;
  hasSeenRole: boolean;
}

export type GamePhase =
  | 'SETUP'
  | 'ROLE_REVEAL'
  | 'NIGHT'
  | 'DAY_ANNOUNCEMENT'
  | 'DISCUSSION'
  | 'VOTE'
  | 'VOTE_RESULT'
  | 'HUNTER_RESOLUTION'
  | 'SCAPEGOAT_CHOICE'
  | 'GAME_OVER';

export type NightStepKind =
  | 'VOLEUR'
  | 'CUPIDON'
  | 'LOVERS_REVEAL'
  | 'SALVATEUR'
  | 'VOYANTE'
  | 'LOUP_GAROU'
  | 'PETITE_FILLE'
  | 'SORCIERE'
  | 'JOUEUR_DE_FLUTE';

export interface NightState {
  stepIndex: number;
  wolvesVotes: Record<string, string>;
  wolfVictimId: string | null;
  salvateurProtectedId: string | null;
  seerResult: { targetId: string; roleId: RoleId } | null;
  witchHealUsedTonight: boolean;
  witchPoisonTargetId: string | null;
  petiteFilleSpySpotted: boolean | null;
  loversRevealed: boolean;
}

export interface VoteState {
  round: 1 | 2;
  eligibleVoterIds: string[];
  candidateIds: string[];
  voterOrder: string[];
  voterIndex: number;
  votes: Record<string, string | 'ABSTAIN'>;
  tally: Record<string, number> | null;
  eliminatedId: string | null;
  wasTieBrokenByScapegoat: boolean;
  noElimination: boolean;
}

export interface HunterState {
  hunterId: string;
  reason: DeathCause;
  next: GamePhase;
}

export interface RoleRevealState {
  order: string[];
  currentIndex: number;
}

export interface VictoryResult {
  winner: 'VILLAGE' | 'WEREWOLVES' | 'LOVERS' | 'JOUEUR_DE_FLUTE';
  winningPlayerIds: string[];
  message: string;
}

export type HistoryEventType =
  | 'GAME_STARTED'
  | 'NIGHT_STARTED'
  | 'NIGHT_ACTION'
  | 'NIGHT_DEATH'
  | 'DAY_STARTED'
  | 'VOTE_CAST'
  | 'VOTE_RESULT'
  | 'HUNTER_SHOT'
  | 'GAME_OVER';

export interface HistoryEvent {
  id: string;
  type: HistoryEventType;
  dayNumber: number;
  nightNumber: number;
  message: string;
  timestamp: number;
}

export interface NarrationLine {
  id: string;
  text: string;
  priority: 'normal' | 'high';
}

export interface SpecialState {
  witchHealUsed: boolean;
  witchPoisonUsed: boolean;
  cupidLoverIds: [string, string] | null;
  salvateurLastProtectedId: string | null;
  voleurExtraRoles: RoleId[];
  voleurHasActed: boolean;
  piperCharmedIds: string[];
  boucEmissaireAllowedVoters: string[] | null;
  ancienPowersLost: boolean;
}

export interface RoleCounts {
  [roleId: string]: number;
}

export interface GameConfig {
  playerCount: number;
  roleCounts: RoleCounts;
  options: GameOptions;
}

export interface GameOptions {
  revealRoleOnDeath: boolean;
  spySpotChance: number;
  discussionDurationSeconds: number;
  narrationEnabled: boolean;
  narrationVolume: number;
  narrationRate: number;
  narrationVoiceURI: string | null;
  animationsEnabled: boolean;
  highContrast: boolean;
}

export interface GameState {
  phase: GamePhase;
  config: GameConfig;
  players: Player[];
  dayNumber: number;
  nightNumber: number;
  history: HistoryEvent[];
  narrationQueue: NarrationLine[];
  night: NightState | null;
  vote: VoteState | null;
  hunter: HunterState | null;
  roleReveal: RoleRevealState | null;
  victory: VictoryResult | null;
  special: SpecialState;
  rngSeed: number;
  /** IDs des joueurs morts pendant le cycle nuit/vote en cours (pour l'affichage des annonces). */
  lastCycleDeaths: string[];
}

export type NightActionPayload =
  | { kind: 'VOLEUR'; swapWith: RoleId | null }
  | { kind: 'CUPIDON'; targetIds: [string, string] }
  | { kind: 'SALVATEUR'; targetId: string }
  | { kind: 'VOYANTE'; targetId: string }
  | { kind: 'LOUP_GAROU'; wolfId: string; targetId: string }
  | { kind: 'PETITE_FILLE'; spy: boolean }
  | { kind: 'SORCIERE'; heal: boolean; poisonTargetId: string | null }
  | { kind: 'JOUEUR_DE_FLUTE'; targetIds: string[] };

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
