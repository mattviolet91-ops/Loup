import type { NightStepKind, RoleId, Team } from '../types';

export interface RoleDefinition {
  id: RoleId;
  name: string;
  emoji: string;
  team: Team;
  /** Un seul exemplaire possible dans la partie. */
  unique: boolean;
  /** Résumé affiché sur la carte de rôle (une phrase). */
  summary: string;
  /** Description complète des pouvoirs, affichée dans "Règles" / révélation. */
  description: string;
  /** Étape de nuit associée, si le rôle agit la nuit. */
  nightStep: NightStepKind | null;
  /** N'agit que la première nuit. */
  firstNightOnly?: boolean;
  /** Nombre minimum de joueurs total requis pour proposer ce rôle. */
  minPlayers?: number;
  /** Ordre d'affichage dans les listes de configuration. */
  order: number;
}

export const ROLES: Record<RoleId, RoleDefinition> = {
  VILLAGEOIS: {
    id: 'VILLAGEOIS',
    name: 'Villageois',
    emoji: '🧑‍🌾',
    team: 'VILLAGE',
    unique: false,
    summary: "Un simple habitant du village, sans pouvoir particulier.",
    description:
      "Le Villageois n'a aucun pouvoir. Son seul outil est la parole et le vote de jour, pour tenter de démasquer les Loups-Garous. Il gagne si le Village élimine tous les Loups-Garous.",
    nightStep: null,
    order: 0,
  },
  LOUP_GAROU: {
    id: 'LOUP_GAROU',
    name: 'Loup-Garou',
    emoji: '🐺',
    team: 'WEREWOLVES',
    unique: false,
    summary: 'Chaque nuit, dévore un villageois avec la meute.',
    description:
      "Chaque nuit, les Loups-Garous se réveillent ensemble, se reconnaissent, puis désignent une victime à dévorer. Le jour, ils doivent se fondre parmi les villageois pour éviter d'être démasqués. Ils gagnent quand ils sont au moins aussi nombreux que le reste des joueurs vivants.",
    nightStep: 'LOUP_GAROU',
    order: 1,
  },
  VOYANTE: {
    id: 'VOYANTE',
    name: 'Voyante',
    emoji: '🔮',
    team: 'VILLAGE',
    unique: true,
    summary: "Chaque nuit, découvre en secret le rôle d'un joueur.",
    description:
      "Chaque nuit, la Voyante consulte secrètement le rôle exact d'un joueur de son choix. Elle seule voit cette information, qui disparaît ensuite de l'écran.",
    nightStep: 'VOYANTE',
    order: 2,
  },
  SORCIERE: {
    id: 'SORCIERE',
    name: 'Sorcière',
    emoji: '🧪',
    team: 'VILLAGE',
    unique: true,
    summary: 'Possède une potion de vie et une potion de mort, chacune à usage unique.',
    description:
      "La Sorcière dispose de deux potions utilisables une seule fois chacune pendant toute la partie : la potion de vie peut sauver la victime des Loups-Garous, la potion de mort peut éliminer n'importe quel joueur. Elle peut utiliser les deux la même nuit si elle le souhaite.",
    nightStep: 'SORCIERE',
    order: 3,
  },
  CHASSEUR: {
    id: 'CHASSEUR',
    name: 'Chasseur',
    emoji: '🏹',
    team: 'VILLAGE',
    unique: true,
    summary: 'En mourant, abat immédiatement un autre joueur.',
    description:
      "Quelle que soit la cause de sa mort (vote, Loups-Garous, potion de mort...), le Chasseur désigne aussitôt un joueur vivant qui est éliminé à son tour.",
    nightStep: null,
    order: 4,
  },
  CUPIDON: {
    id: 'CUPIDON',
    name: 'Cupidon',
    emoji: '💘',
    team: 'VILLAGE',
    unique: true,
    summary: 'La première nuit, désigne deux Amoureux.',
    description:
      "Uniquement lors de la première nuit, Cupidon désigne deux joueurs (lui-même éventuellement compris) qui deviennent Amoureux. Si l'un des deux meurt, l'autre meurt aussitôt de chagrin. S'ils sont les deux derniers survivants, ils gagnent ensemble.",
    nightStep: 'CUPIDON',
    firstNightOnly: true,
    minPlayers: 3,
    order: 5,
  },
  PETITE_FILLE: {
    id: 'PETITE_FILLE',
    name: 'Petite Fille',
    emoji: '👧',
    team: 'VILLAGE',
    unique: true,
    summary: 'Peut espionner les Loups-Garous en prenant un risque.',
    description:
      "Pendant que les Loups-Garous choisissent leur victime, la Petite Fille peut tenter d'espionner. Si elle se fait repérer, elle devient la victime à la place de la cible initiale.",
    nightStep: 'PETITE_FILLE',
    order: 6,
  },
  VOLEUR: {
    id: 'VOLEUR',
    name: 'Voleur',
    emoji: '🃏',
    team: 'VILLAGE',
    unique: true,
    summary: 'La première nuit, peut échanger sa carte contre une carte non distribuée.',
    description:
      "Deux cartes supplémentaires sont ajoutées à la pioche sans être distribuées. La première nuit, avant tout le monde, le Voleur regarde ces deux cartes et peut échanger la sienne contre l'une d'elles (obligatoire si les deux sont des Loups-Garous).",
    nightStep: 'VOLEUR',
    firstNightOnly: true,
    minPlayers: 5,
    order: 7,
  },
  SALVATEUR: {
    id: 'SALVATEUR',
    name: 'Salvateur',
    emoji: '🛡️',
    team: 'VILLAGE',
    unique: true,
    summary: 'Chaque nuit, protège un joueur des Loups-Garous.',
    description:
      "Chaque nuit, le Salvateur protège un joueur de son choix contre l'attaque des Loups-Garous (mais pas contre la Sorcière ou le vote). Il ne peut pas protéger la même personne deux nuits de suite.",
    nightStep: 'SALVATEUR',
    order: 8,
  },
  ANCIEN: {
    id: 'ANCIEN',
    name: 'Ancien',
    emoji: '👴',
    team: 'VILLAGE',
    unique: true,
    summary: 'Survit à la première attaque des Loups-Garous.',
    description:
      "L'Ancien survit à la première attaque des Loups-Garous (mais pas à la Sorcière, ni au vote, ni au Chasseur). Si le village l'élimine par erreur lors d'un vote, tous les villageois perdent définitivement leurs pouvoirs.",
    nightStep: null,
    minPlayers: 7,
    order: 9,
  },
  IDIOT_DU_VILLAGE: {
    id: 'IDIOT_DU_VILLAGE',
    name: 'Idiot du Village',
    emoji: '🤪',
    team: 'VILLAGE',
    unique: true,
    summary: 'Survit à son élimination par le village, mais perd le droit de vote.',
    description:
      "Si le village l'élimine par le vote, l'Idiot du Village révèle sa carte et reste en vie, mais perd définitivement son droit de vote. Il reste vulnérable aux Loups-Garous, à la Sorcière et au Chasseur.",
    nightStep: null,
    minPlayers: 7,
    order: 10,
  },
  BOUC_EMISSAIRE: {
    id: 'BOUC_EMISSAIRE',
    name: 'Bouc Émissaire',
    emoji: '🐐',
    team: 'VILLAGE',
    unique: true,
    summary: 'Éliminé automatiquement en cas d\'égalité des votes.',
    description:
      "En cas d'égalité lors d'un vote, le Bouc Émissaire est éliminé à la place d'un nouveau tour. En mourant ainsi, il choisit qui aura le droit de voter au tour suivant.",
    nightStep: null,
    minPlayers: 7,
    order: 11,
  },
  JOUEUR_DE_FLUTE: {
    id: 'JOUEUR_DE_FLUTE',
    name: 'Joueur de Flûte',
    emoji: '🪈',
    team: 'INDEPENDENT',
    unique: true,
    summary: 'Charme deux joueurs chaque nuit ; gagne seul si tout le monde est charmé.',
    description:
      "Chaque nuit, le Joueur de Flûte charme deux joueurs. Il gagne seul dès que tous les joueurs vivants restants sont charmés. S'il meurt, tous les joueurs charmés sont libérés.",
    nightStep: 'JOUEUR_DE_FLUTE',
    minPlayers: 8,
    order: 12,
  },
};

export const ROLE_LIST: RoleDefinition[] = Object.values(ROLES).sort((a, b) => a.order - b.order);

export function getRole(id: RoleId): RoleDefinition {
  return ROLES[id];
}

export const UNIQUE_ROLE_IDS: RoleId[] = ROLE_LIST.filter((r) => r.unique).map((r) => r.id);
